'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'bs' | 'en'

type Dict = Record<string, string>

const bs: Dict = {
  'nav.games': 'Igre',
  'nav.leaderboard': 'Rang-lista',
  'nav.friends': 'Prijatelji',
  'nav.login': 'Prijava',
  'nav.register': 'Registracija',
  'nav.play': 'Igraj',

  'common.loading': 'Učitavanje…',
  'common.copy': 'Kopiraj',
  'common.copied': 'Kopirano',
  'common.send': 'Pošalji',
  'common.save': 'Sačuvaj',
  'prof.game': 'Igra',

  'land.heroTitle': 'Tvoja arena za multiplayer mini-igre',
  'land.heroText':
    'Igraj Tic-Tac-Toe, Poker, Battleships, Coup i još mnogo igara. Izazovi prijatelje online preko koda sobe ili igraj lokalno.',
  'land.start': 'Počni igrati',
  'land.play': 'Igraj',
  'land.viewGames': 'Pogledaj igre',
  'land.pill': '{count} igara · {playable} već igrivo',
  'land.f1t': 'Online sobe',
  'land.f1x': 'Napravi sobu, podijeli 6-znakovni kod i igraj s bilo kim u stvarnom vremenu.',
  'land.f2t': 'Lokalna igra',
  'land.f2x': 'Svaka igra ima i lokalni mod — igrajte na istom uređaju, ili protiv botova.',
  'land.f3t': 'Statistika i XP',
  'land.f3x': 'Skupljaj XP za svaki meč, prati pobjede i penji se na rang-listi.',
  'land.footer': 'Napravljeno s Next.js, Socket.IO i node:sqlite',

  'auth.loginTitle': 'Prijava',
  'auth.registerTitle': 'Napravi nalog',
  'auth.loginSubtitle': 'Dobrodošao nazad!',
  'auth.registerSubtitle': 'Pridruži se i počni igrati.',
  'auth.identifier': 'Email ili korisničko ime',
  'auth.email': 'Email',
  'auth.username': 'Korisničko ime',
  'auth.password': 'Lozinka',
  'auth.forgot': 'Zaboravili ste lozinku?',
  'auth.signIn': 'Prijavi se',
  'auth.signUp': 'Registruj se',
  'auth.wait': 'Sačekaj…',
  'auth.noAccount': 'Nemaš nalog?',
  'auth.haveAccount': 'Već imaš nalog?',

  'forgot.title': 'Zaboravljena lozinka',
  'forgot.subtitle': 'Unesi email i poslat ćemo ti link za reset.',
  'forgot.send': 'Pošalji link',
  'forgot.sending': 'Šaljem…',
  'forgot.sent': 'Ako nalog s tim emailom postoji, link za reset lozinke je poslan. Provjeri inbox (i spam).',
  'forgot.devLink': 'Email server nije konfigurisan, pa evo direktnog linka:',
  'forgot.resetLink': 'Resetuj lozinku',
  'forgot.remembered': 'Sjetio/la si se?',

  'reset.title': 'Nova lozinka',
  'reset.subtitle': 'Postavi novu lozinku za svoj nalog.',
  'reset.new': 'Nova lozinka',
  'reset.confirm': 'Potvrdi lozinku',
  'reset.submit': 'Postavi novu lozinku',
  'reset.mismatch': 'Lozinke se ne poklapaju',
  'reset.missing': 'Link nije ispravan — nedostaje token.',
  'reset.requestNew': 'Zatraži novi',
  'reset.back': 'Nazad na prijavu',

  'prof.edit': 'Uredi profil',
  'prof.close': 'Zatvori',
  'prof.friendCode': 'Friend kod:',
  'prof.level': 'Nivo {level} · {xp} XP',
  'prof.wins': 'Pobjede',
  'prof.played': 'Odigrano',
  'prof.totalXp': 'Ukupno XP',
  'prof.perGame': 'Po igrama',
  'prof.noGames': 'Još nema odigranih partija. Odigraj online meč da skupiš XP!',
  'prof.avatar': 'Profilna slika',
  'prof.remove': 'Ukloni',
  'prof.usernameSection': 'Korisničko ime',
  'prof.newUsername': 'Novo korisničko ime',
  'prof.passwordSection': 'Promjena lozinke',
  'prof.currentPassword': 'Trenutna lozinka',
  'prof.newPassword': 'Nova lozinka',
  'prof.changePw': 'Promijeni',
  'prof.savedUsername': 'Korisničko ime sačuvano.',
  'prof.savedAvatar': 'Slika sačuvana.',
  'prof.removedAvatar': 'Slika uklonjena.',
  'prof.changedPw': 'Lozinka promijenjena.',
  'prof.history': 'Historija mečeva',
  'prof.noHistory': 'Još nema odigranih online mečeva.',

  'fr.title': 'Prijatelji',
  'fr.yourCode': 'Tvoj friend kod:',
  'fr.add': 'Dodaj prijatelja (friend kod ili korisničko ime)',
  'fr.requestSent': 'Zahtjev poslan.',
  'fr.nowFriends': 'Sada ste prijatelji!',
  'fr.requests': 'Zahtjevi za prijateljstvo',
  'fr.accept': 'Prihvati',
  'fr.decline': 'Odbij',
  'fr.mine': 'Moji prijatelji',
  'fr.none': 'Još nemaš prijatelja. Pošalji nekome svoj friend kod!',
  'fr.sent': 'Poslani zahtjevi',
  'fr.pending': 'na čekanju…',
  'fr.remove': 'Ukloni',

  'lb.title': 'Rang-lista',
  'lb.all': 'Svi',
  'lb.friends': 'Ja i prijatelji',
  'lb.allGames': 'Sve igre',
  'lb.none': 'Još nema rezultata. Budi prvi!',
  'lb.noneFriends': 'Ti i tvoji prijatelji još nemate rezultata. Odigrajte online meč!',
  'lb.wins': 'pob.',

  'res.win': 'Pobjeda',
  'res.loss': 'Poraz',
  'res.draw': 'Neriješeno',

  'chat.title': 'Razgovor',
  'chat.placeholder': 'Napiši poruku…',
}

const en: Dict = {
  'nav.games': 'Games',
  'nav.leaderboard': 'Leaderboard',
  'nav.friends': 'Friends',
  'nav.login': 'Log in',
  'nav.register': 'Sign up',
  'nav.play': 'Play',

  'common.loading': 'Loading…',
  'common.copy': 'Copy',
  'common.copied': 'Copied',
  'common.send': 'Send',
  'common.save': 'Save',
  'prof.game': 'Game',

  'land.heroTitle': 'Your arena for multiplayer mini-games',
  'land.heroText':
    'Play Tic-Tac-Toe, Poker, Battleships, Coup and many more. Challenge friends online with a room code or play locally.',
  'land.start': 'Start playing',
  'land.play': 'Play',
  'land.viewGames': 'Browse games',
  'land.pill': '{count} games · {playable} playable now',
  'land.f1t': 'Online rooms',
  'land.f1x': 'Create a room, share a 6-character code and play anyone in real time.',
  'land.f2t': 'Local play',
  'land.f2x': 'Every game has a local mode — play on one device, or against bots.',
  'land.f3t': 'Stats & XP',
  'land.f3x': 'Earn XP every match, track your wins and climb the leaderboard.',
  'land.footer': 'Built with Next.js, Socket.IO and node:sqlite',

  'auth.loginTitle': 'Log in',
  'auth.registerTitle': 'Create account',
  'auth.loginSubtitle': 'Welcome back!',
  'auth.registerSubtitle': 'Join and start playing.',
  'auth.identifier': 'Email or username',
  'auth.email': 'Email',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.forgot': 'Forgot your password?',
  'auth.signIn': 'Log in',
  'auth.signUp': 'Sign up',
  'auth.wait': 'Please wait…',
  'auth.noAccount': "Don't have an account?",
  'auth.haveAccount': 'Already have an account?',

  'forgot.title': 'Forgot password',
  'forgot.subtitle': "Enter your email and we'll send a reset link.",
  'forgot.send': 'Send link',
  'forgot.sending': 'Sending…',
  'forgot.sent': 'If an account with that email exists, a reset link has been sent. Check your inbox (and spam).',
  'forgot.devLink': 'No mail server is configured, so here is a direct link:',
  'forgot.resetLink': 'Reset password',
  'forgot.remembered': 'Remembered it?',

  'reset.title': 'New password',
  'reset.subtitle': 'Set a new password for your account.',
  'reset.new': 'New password',
  'reset.confirm': 'Confirm password',
  'reset.submit': 'Set new password',
  'reset.mismatch': "Passwords don't match",
  'reset.missing': 'Invalid link — token is missing.',
  'reset.requestNew': 'Request a new one',
  'reset.back': 'Back to login',

  'prof.edit': 'Edit profile',
  'prof.close': 'Close',
  'prof.friendCode': 'Friend code:',
  'prof.level': 'Level {level} · {xp} XP',
  'prof.wins': 'Wins',
  'prof.played': 'Played',
  'prof.totalXp': 'Total XP',
  'prof.perGame': 'By game',
  'prof.noGames': 'No games played yet. Play an online match to earn XP!',
  'prof.avatar': 'Profile picture',
  'prof.remove': 'Remove',
  'prof.usernameSection': 'Username',
  'prof.newUsername': 'New username',
  'prof.passwordSection': 'Change password',
  'prof.currentPassword': 'Current password',
  'prof.newPassword': 'New password',
  'prof.changePw': 'Change',
  'prof.savedUsername': 'Username saved.',
  'prof.savedAvatar': 'Picture saved.',
  'prof.removedAvatar': 'Picture removed.',
  'prof.changedPw': 'Password changed.',
  'prof.history': 'Match history',
  'prof.noHistory': 'No online matches played yet.',

  'fr.title': 'Friends',
  'fr.yourCode': 'Your friend code:',
  'fr.add': 'Add a friend (friend code or username)',
  'fr.requestSent': 'Request sent.',
  'fr.nowFriends': "You're now friends!",
  'fr.requests': 'Friend requests',
  'fr.accept': 'Accept',
  'fr.decline': 'Decline',
  'fr.mine': 'My friends',
  'fr.none': 'No friends yet. Send someone your friend code!',
  'fr.sent': 'Sent requests',
  'fr.pending': 'pending…',
  'fr.remove': 'Remove',

  'lb.title': 'Leaderboard',
  'lb.all': 'Everyone',
  'lb.friends': 'Me & friends',
  'lb.allGames': 'All games',
  'lb.none': 'No results yet. Be the first!',
  'lb.noneFriends': "You and your friends have no results yet. Play an online match!",
  'lb.wins': 'wins',

  'res.win': 'Win',
  'res.loss': 'Loss',
  'res.draw': 'Draw',

  'chat.title': 'Chat',
  'chat.placeholder': 'Type a message…',
}

const DICTS: Record<Lang, Dict> = { bs, en }

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const Ctx = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('bs')

  useEffect(() => {
    const stored = window.localStorage.getItem('gv_lang')
    if (stored === 'bs' || stored === 'en') setLangState(stored)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    window.localStorage.setItem('gv_lang', l)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = DICTS[lang][key] ?? DICTS.bs[key] ?? key
      if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]))
      return s
    },
    [lang],
  )

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useT(): I18nValue {
  const c = useContext(Ctx)
  if (!c) throw new Error('useT se mora koristiti unutar <I18nProvider>')
  return c
}
