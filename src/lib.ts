import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const db = url && key ? createClient(url, key) : null;
export type Profile = { id: string; name: string; bio: string; city: string };
export type Comment = {
  id: string;
  body: string;
  user_id: string;
  profiles: Profile;
};
export type Post = {
  id: string;
  user_id: string;
  body: string;
  kind: string;
  image_url: string | null;
  image_path?: string | null;
  created_at: string;
  profiles: Profile;
  comments: Comment[];
  reactions: { user_id: string }[];
};
export const kinds = ["הכול", "פאנץ׳", "רעיון", "חומר"];
export const demo: Post[] = [
  {
    id: "demo-1",
    user_id: "a",
    kind: "פאנץ׳",
    body: "הפסיכולוג שלי אמר שאני צריך ללמוד לשחרר.\nאז שחררתי אותו. חסכתי 400 שקל בשבוע.\n\nמרגיש לי שחסר עוד ביט בסוף. מה אתם אומרים?",
    image_url: null,
    created_at: new Date().toISOString(),
    profiles: {
      id: "a",
      name: "נועם לוי",
      bio: "בודק גבולות. בעיקר של הקהל.",
      city: "תל אביב",
    },
    comments: [
      {
        id: "c1",
        user_id: "b",
        body: "אולי: ״עכשיו אני מספר את הבעיות שלי לרואה חשבון. לפחות הוא מחזיר לי משהו.״",
        profiles: { id: "b", name: "מאיה כהן", bio: "", city: "חיפה" },
      },
    ],
    reactions: [],
  },
  {
    id: "demo-2",
    user_id: "b",
    kind: "רעיון",
    body: "רעיון לקטע: קבוצות וואטסאפ של הבניין הן בעצם ריאליטי בלי תקציב.\nיש נבל, יש בריתות, ובסוף תמיד מישהו עוזב בטריקת דלת.\n\nמי עוד מרגיש שהוועד שלו צריך סוכן?",
    image_url: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    profiles: {
      id: "b",
      name: "מאיה כהן",
      bio: "סטנדאפ, קפה ושאלות קשות.",
      city: "חיפה",
    },
    comments: [],
    reactions: [],
  },
  {
    id: "demo-3",
    user_id: "c",
    kind: "חומר",
    body: "תזכורת לעצמי לפני במה פתוחה:\n1. לנשום.\n2. לא להתנצל על הבדיחה.\n3. אם אף אחד לא צוחק — לפחות התאורה טובה.\n\nשתפו טיפ אחד שעזר לכם בהופעה הראשונה 👇",
    image_url: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    profiles: {
      id: "c",
      name: "איתי ברק",
      bio: "עוד חמש דקות על הבמה.",
      city: "ירושלים",
    },
    comments: [],
    reactions: [],
  },
];
export function relativeTime(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );
  return minutes < 1
    ? "הרגע"
    : minutes < 60
      ? `לפני ${minutes} דקות`
      : minutes < 1440
        ? `לפני ${Math.floor(minutes / 60)} שעות`
        : new Date(date).toLocaleDateString("he-IL");
}
export async function checked<T>(
  query: PromiseLike<{ data: T; error: unknown }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
