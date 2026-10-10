import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("PostgreSQL schema is repeatable and enforces ownership, membership, reactions and cascades", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`create role anon;create role authenticated;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant execute on function auth.uid() to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 grant insert,delete,select on storage.objects to authenticated;
 `);
    const migration = await readFile(
      new URL("../supabase/schema.sql", import.meta.url),
      "utf8",
    );
    await pg.exec(migration);
    await pg.exec(migration);
    assert.equal(
      (
        await pg.query(
          "select public from storage.buckets where id='post-images'",
        )
      ).rows[0].public,
      false,
    );
    const a = "00000000-0000-4000-8000-000000000001",
      b = "00000000-0000-4000-8000-000000000002";
    await pg.query("insert into auth.users values ($1,$2),($3,$4)", [
      a,
      JSON.stringify({ name: "יוצר א" }),
      b,
      JSON.stringify({ name: "יוצר ב" }),
    ]);
    assert.equal((await pg.query("select * from profiles")).rows.length, 2);
    await pg.exec(`set role authenticated;set request.jwt.claim.sub='${a}';`);
    const result = await pg.query(
      "insert into posts(user_id,body,kind) values ($1,$2,$3) returning id",
      [a, "פאנץ לבדיקה", "פאנץ׳"],
    );
    const post = result.rows[0].id;
    await assert.rejects(
      pg.query("insert into posts(user_id,body,kind) values ($1,$2,$3)", [
        b,
        "התחזות",
        "רעיון",
      ]),
      /row-level security/,
    );
    await assert.rejects(
      pg.query("insert into posts(user_id,body,kind) values ($1,$2,$3)", [
        a,
        "",
        "רעיון",
      ]),
      /check constraint/,
    );
    await pg.query(
      "insert into storage.objects(bucket_id,name) values ($1,$2)",
      ["post-images", a + "/image.png"],
    );
    await assert.rejects(
      pg.query("insert into storage.objects(bucket_id,name) values ($1,$2)", [
        "post-images",
        b + "/image.png",
      ]),
      /row-level security/,
    );
    await pg.exec(`set request.jwt.claim.sub='${b}';`);
    assert.equal((await pg.query("select * from posts")).rows.length, 1);
    assert.equal(
      (await pg.query("delete from posts where id=$1 returning id", [post]))
        .rows.length,
      0,
    );
    assert.equal(
      (
        await pg.query("update profiles set name=$1 where id=$2 returning id", [
          "התחזות",
          a,
        ])
      ).rows.length,
      0,
    );
    await pg.query(
      "insert into comments(post_id,user_id,body) values ($1,$2,$3)",
      [post, b, "פידבק"],
    );
    await pg.query("insert into reactions(post_id,user_id) values ($1,$2)", [
      post,
      b,
    ]);
    await assert.rejects(
      pg.query("insert into reactions(post_id,user_id) values ($1,$2)", [
        post,
        b,
      ]),
      /duplicate key/,
    );
    await pg.query(
      "insert into reports(post_id,user_id,reason) values ($1,$2,$3)",
      [post, b, "בדיקת דיווח"],
    );
    await assert.rejects(
      pg.query("select * from reports"),
      /permission denied/,
    );
    await pg.exec(
      "reset role;grant select on public.posts to anon;set role anon",
    );
    assert.equal((await pg.query("select * from posts")).rows.length, 0);
    await pg.exec(`set role authenticated;set request.jwt.claim.sub='${a}';`);
    await pg.query("delete from posts where id=$1", [post]);
    await pg.exec("reset role");
    for (const table of ["posts", "comments", "reactions", "reports"])
      assert.equal((await pg.query(`select * from ${table}`)).rows.length, 0);
  } finally {
    await pg.close();
  }
});
