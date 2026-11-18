/**
 * Leaderboards: Firebase Firestore (anonymous auth) when VITE_FIREBASE_* keys exist,
 * otherwise a local-only fallback built from this device's own plays.
 * Firebase is dynamically imported so it never ships in the main bundle.
 */
import { dateKey, weekKey } from './rng';
import { useStore } from './store';

export type Board = 'daily' | 'weekly' | 'alltime';
export interface Entry { name: string; score: number; date: string; you?: boolean }

const env = import.meta.env;
export const firebaseEnabled = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);

type FB = {
  db: import('firebase/firestore').Firestore;
  uid: string;
  fs: typeof import('firebase/firestore');
};
let fbPromise: Promise<FB | null> | null = null;

function getFirebase(): Promise<FB | null> {
  if (!firebaseEnabled) return Promise.resolve(null);
  if (!fbPromise) {
    fbPromise = (async () => {
      try {
        const [{ initializeApp }, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
        const app = initializeApp({
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.VITE_FIREBASE_APP_ID,
        });
        const a = auth.getAuth(app);
        const cred = await auth.signInAnonymously(a);
        return { db: fs.getFirestore(app), uid: cred.user.uid, fs };
      } catch (e) {
        console.warn('[leaderboard] Firebase unavailable, using local fallback', e);
        return null;
      }
    })();
  }
  return fbPromise;
}

export async function submitScore(game: string, score: number, name: string): Promise<'remote' | 'local'> {
  const fb = await getFirebase();
  if (!fb) return 'local';
  const date = dateKey();
  const { doc, setDoc, serverTimestamp } = fb.fs;
  try {
    // One doc per player per game per day; rules forbid overwrites, so the daily is a single attempt.
    await setDoc(doc(fb.db, 'scores', `${game}_${date}_${fb.uid}`), {
      game, date, week: weekKey(), score: Math.round(score), name: (name || 'Anonymous').slice(0, 18), uid: fb.uid, ts: serverTimestamp(),
    });
    return 'remote';
  } catch (e) {
    console.warn('[leaderboard] submit failed', e);
    return 'local';
  }
}

export async function fetchBoard(game: string, board: Board): Promise<{ source: 'remote' | 'local'; entries: Entry[] }> {
  const fb = await getFirebase();
  if (fb) {
    try {
      const { collection, query, where, orderBy, limit, getDocs } = fb.fs;
      const base = collection(fb.db, 'scores');
      const filters = [where('game', '==', game)];
      if (board === 'daily') filters.push(where('date', '==', dateKey()));
      if (board === 'weekly') filters.push(where('week', '==', weekKey()));
      const snap = await getDocs(query(base, ...filters, orderBy('score', 'desc'), limit(25)));
      return {
        source: 'remote',
        entries: snap.docs.map((d) => {
          const x = d.data();
          return { name: x.name, score: x.score, date: x.date, you: x.uid === fb.uid };
        }),
      };
    } catch (e) {
      console.warn('[leaderboard] fetch failed, local fallback', e);
    }
  }
  return { source: 'local', entries: localBoard(game, board) };
}

function localBoard(game: string, board: Board): Entry[] {
  const { plays, nickname } = useStore.getState();
  const today = dateKey(), week = weekKey();
  return plays
    .filter((p) => p.game === game && (board === 'alltime' || (board === 'daily' ? p.date === today : weekKey(new Date(p.date + 'T12:00:00Z')) === week)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map((p) => ({ name: (nickname || 'You') + (p.mode === 'practice' ? ' · practice' : ''), score: p.score, date: p.date, you: true }));
}
