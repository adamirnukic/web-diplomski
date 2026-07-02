/**
 * Short "how to play" rules per game, shown in the HowToPlay modal.
 * Keyed by game id; each language is a list of concise steps.
 */
export const GAME_RULES: Record<string, { bs: string[]; en: string[] }> = {
  'tic-tac-toe': {
    bs: [
      'Igra se na mreži 3×3.',
      'Igrači se smjenjuju stavljajući svoj znak — X ili O.',
      'Pobjeđuje ko prvi poreda tri svoja znaka u niz: vodoravno, uspravno ili dijagonalno.',
      'Ako se mreža popuni bez pobjednika — neriješeno.',
    ],
    en: [
      'Played on a 3×3 grid.',
      'Players alternate placing their mark — X or O.',
      'First to line up three of their marks — horizontally, vertically or diagonally — wins.',
      'If the grid fills with no winner, it is a draw.',
    ],
  },
  'connect-four': {
    bs: [
      'Naizmjenično ubacujete žetone u kolone — padaju na dno.',
      'Cilj je spojiti 4 svoja žetona u nizu.',
      'Niz može biti vodoravan, uspravan ili dijagonalan.',
      'Ko prvi spoji četiri — pobjeđuje.',
    ],
    en: [
      'Take turns dropping discs into columns — they fall to the bottom.',
      'The goal is to line up 4 of your discs in a row.',
      'The line can be horizontal, vertical or diagonal.',
      'First to connect four wins.',
    ],
  },
  'dots-and-boxes': {
    bs: [
      'Naizmjenično povlačite jednu ivicu između dvije tačke.',
      'Ko zatvori četvrtu stranicu kvadrata, osvaja ga — i igra ponovo.',
      'Kad se povuku sve ivice, pobjeđuje ko ima više kvadrata.',
    ],
    en: [
      'Take turns drawing one edge between two dots.',
      'Closing the fourth side of a box claims it — and you go again.',
      'When all edges are drawn, whoever owns more boxes wins.',
    ],
  },
  battleships: {
    bs: [
      'Prvo rasporediš svoju flotu — brodovi se ne smiju dodirivati.',
      'Zatim naizmjenično gađate polja na protivničkoj mreži.',
      'Pogodak otkriva dio broda; promašaj predaje potez.',
      'Ko prvi potopi sve protivničke brodove — pobjeđuje.',
    ],
    en: [
      'First place your fleet — ships may not touch each other.',
      'Then take turns firing at squares on the opponent’s grid.',
      'A hit reveals part of a ship; a miss passes the turn.',
      'First to sink all enemy ships wins.',
    ],
  },
  blackjack: {
    bs: [
      'Cilj je zbir karata što bliži 21, a da ga ne pređeš.',
      'Figure vrijede 10, a as 1 ili 11 (kako ti odgovara).',
      '“Vuci” za novu kartu ili “stani” kad si zadovoljan.',
      'Prelazak preko 21 je gubitak (bust). Djelitelj vuče do 17.',
    ],
    en: [
      'Get your card total as close to 21 as possible without going over.',
      'Face cards are 10; an ace is 1 or 11, whichever helps.',
      '“Hit” for another card or “stand” when satisfied.',
      'Going over 21 is a bust. The dealer draws to 17.',
    ],
  },
  poker: {
    bs: [
      'Svako dobije 2 skrivene karte; 5 zajedničkih se otkriva postupno.',
      'Kroz runde uloga: prati (call), povećaj (raise), ili odustani (fold).',
      'Praviš najbolju kombinaciju od 5 karata.',
      'Najbolja ruka na otkrivanju (ili zadnji koji nije odustao) osvaja pot.',
    ],
    en: [
      'Each player gets 2 hidden cards; 5 shared cards are revealed in stages.',
      'Across betting rounds: call, raise, or fold.',
      'You build the best 5-card hand.',
      'Best hand at showdown — or the last player standing — wins the pot.',
    ],
  },
  'love-letter': {
    bs: [
      'Držiš 1 kartu; u potezu vučeš drugu i jednu odigraš zbog njenog efekta.',
      'Straža pogađa protivničku kartu, Barun je dvoboj, Princeza gubi ako je odbaciš…',
      'Cilj je ostati zadnji u rundi ili imati najjaču kartu kad špil presuši.',
      'Osvoji dovoljno rundi (žetona naklonosti) za pobjedu.',
    ],
    en: [
      'You hold 1 card; on your turn draw a second and play one for its effect.',
      'Guard guesses a card, Baron duels, Princess loses if discarded…',
      'Aim to be the last player in the round or hold the highest card when the deck runs out.',
      'Win enough rounds (favor tokens) to take the game.',
    ],
  },
  yahtzee: {
    bs: [
      'Bacaš 5 kockica, do 3 puta po potezu (zadržavaš koje želiš).',
      'Rezultat upišeš u jednu od kategorija (parovi, kenta, ful…).',
      'Yahtzee — pet istih — nosi 50 bodova.',
      'Kad se sve kategorije popune, najviše bodova pobjeđuje.',
    ],
    en: [
      'Roll 5 dice, up to 3 times per turn (keep the ones you like).',
      'Score the result in one category (pairs, straight, full house…).',
      'A Yahtzee — five of a kind — is worth 50 points.',
      'When every category is filled, the highest total wins.',
    ],
  },
  memory: {
    bs: [
      'Sve karte su okrenute licem nadolje.',
      'Okreni dvije — ako su par, uzimaš ih i igraš ponovo.',
      'Ako nisu par, vraćaju se nadolje (zapamti gdje su!).',
      'Ko sakupi više parova — pobjeđuje.',
    ],
    en: [
      'All cards start face down.',
      'Flip two — if they match, you take them and go again.',
      'If they don’t match, they flip back (remember where they were!).',
      'Whoever collects more pairs wins.',
    ],
  },
  checkers: {
    bs: [
      'Figure se kreću dijagonalno naprijed po jedno polje.',
      'Preskačeš protivničku figuru da je pojedeš — uzimanje je obavezno.',
      'Na zadnjem redu figura postaje “dama” i kreće se u oba smjera.',
      'Pobjeđuje ko pojede ili blokira sve protivničke figure.',
    ],
    en: [
      'Pieces move one square diagonally forward.',
      'Jump an opponent’s piece to capture it — capturing is mandatory.',
      'Reach the last row and a piece becomes a “king”, moving both ways.',
      'Win by capturing or blocking all enemy pieces.',
    ],
  },
  'rock-paper-scissors': {
    bs: [
      'Istovremeno birate: kamen, list ili makaze.',
      'Kamen tupi makaze, makaze sijeku list, list pokriva kamen.',
      'Isti izbor — runda je neriješena.',
      'Igra se na najbolje od 5 rundi.',
    ],
    en: [
      'Both choose at once: rock, paper or scissors.',
      'Rock blunts scissors, scissors cut paper, paper covers rock.',
      'Same choice — the round is a tie.',
      'Played as best of 5 rounds.',
    ],
  },
  hangman: {
    bs: [
      'Pogađaš skrivenu riječ slovo po slovo.',
      'Svako pogrešno slovo dodaje dio vješala.',
      'Pogodi cijelu riječ prije nego se vješalo dovrši.',
      'Previše pogrešaka — gubiš.',
    ],
    en: [
      'Guess the hidden word letter by letter.',
      'Each wrong letter adds a part of the gallows.',
      'Reveal the whole word before the gallows is finished.',
      'Too many mistakes and you lose.',
    ],
  },
  minesweeper: {
    bs: [
      'Otkrivaj polja bez mina.',
      'Broj na polju govori koliko ga mina dodiruje.',
      'Označi sumnjiva polja zastavicom.',
      'Otvori sva sigurna polja da pobijediš — mina te odmah digne u zrak.',
    ],
    en: [
      'Uncover squares without mines.',
      'A number shows how many mines touch that square.',
      'Flag the squares you suspect.',
      'Clear all safe squares to win — a mine ends it instantly.',
    ],
  },
  'trivia-quiz': {
    bs: [
      'Odgovaraš na pitanja iz raznih oblasti.',
      'Svaki tačan odgovor nosi bodove.',
      'Biraš jedan od ponuđenih odgovora.',
      'Najviše bodova na kraju pobjeđuje.',
    ],
    en: [
      'Answer questions from various topics.',
      'Each correct answer scores points.',
      'Pick one of the offered answers.',
      'The highest score at the end wins.',
    ],
  },
  perudo: {
    bs: [
      'Svako baca kockice skriveno, pod čašom.',
      'Licitiraš koliko UKUPNO ima kockica neke vrijednosti (npr. “pet petica”).',
      'Sljedeći igrač podigne ulog ili vikne “Laž!”.',
      'Ko izgubi izazov gubi kockicu. Zadnji s kockicama pobjeđuje. Jedinice su divlje.',
    ],
    en: [
      'Everyone rolls dice secretly, under a cup.',
      'Bid how many dice of a value there are in TOTAL (e.g. “five fives”).',
      'The next player raises the bid or calls “Liar!”.',
      'Lose the challenge, lose a die. Last player with dice wins. Ones are wild.',
    ],
  },
  'cant-stop': {
    bs: [
      'Bacaš 4 kockice i spajaš ih u dva zbira.',
      'Privremenim markerima napreduješ po tim kolonama.',
      'Možeš nastaviti bacati ili “stati” i trajno sačuvati napredak.',
      'Ako nijedan zbir ne možeš odigrati — gubiš napredak tog poteza. Osvoji 3 kolone.',
    ],
    en: [
      'Roll 4 dice and combine them into two sums.',
      'Advance temporary markers up those columns.',
      'Keep rolling or “stop” to lock in your progress.',
      'If no sum is playable, you lose this turn’s progress. Claim 3 columns to win.',
    ],
  },
  skull: {
    bs: [
      'Svako ima nekoliko cvjetova i jednu lobanju.',
      'Naizmjenično stavljate diskove licem nadolje.',
      'Neko nazove koliko cvjetova može okrenuti bez lobanje.',
      'Okreni toliko cvjetova (počevši od svojih) — uspjeh nosi bod, lobanja kažnjava. Dva boda pobjeđuju.',
    ],
    en: [
      'Each player has some flowers and one skull.',
      'Take turns placing discs face down.',
      'Someone bids how many flowers they can flip without hitting a skull.',
      'Flip that many (starting with your own) — success scores, a skull punishes. Two points win.',
    ],
  },
  coup: {
    bs: [
      'Svako ima 2 skrivena uticaja (karte likova) i nešto novca.',
      'U potezu tvrdiš akciju lika (npr. Vojvoda uzima porez) — smiješ i blefirati.',
      'Drugi mogu izazvati tvoj blef ili blokirati akciju.',
      'Izgubljen izazov košta kartu. Zadnji sa uticajem pobjeđuje.',
    ],
    en: [
      'Each player has 2 hidden influences (character cards) and some coins.',
      'On your turn claim a character’s action (e.g. Duke takes tax) — bluffing is allowed.',
      'Others may challenge your bluff or block the action.',
      'Lose a challenge and lose a card. Last player with influence wins.',
    ],
  },
  'six-nimmt': {
    bs: [
      'Svi istovremeno biraju po jednu kartu iz ruke.',
      'Karte se slažu od najmanje na 4 reda — svaka uz najbliži manji broj.',
      '6. karta u redu “kupi” cijeli red: dobiješ te volovske glave (kazneni bodovi).',
      'Prenisku kartu moraš zamijeniti za cijeli red. Najmanje glava na kraju pobjeđuje.',
    ],
    en: [
      'Everyone picks one card from hand at the same time.',
      'Cards are placed lowest-first onto 4 rows — each next to the closest smaller number.',
      'The 6th card in a row “scoops” it: you take those bull heads (penalty points).',
      'A too-low card must swap for a whole row. Fewest heads at the end wins.',
    ],
  },
  'flip-7': {
    bs: [
      'Vučeš karte s brojevima i sabiraš ih.',
      'Izvučeš li broj koji već imaš — bust (gubiš rundu), osim uz Drugu šansu.',
      '“Stani” na vrijeme da upišeš skupljene bodove.',
      '7 različitih brojeva nosi bonus. Prvi do 200 bodova pobjeđuje.',
    ],
    en: [
      'Draw number cards and add them up.',
      'Draw a number you already have and you bust (lose the round) — unless you have a Second Chance.',
      '“Stay” in time to bank your points.',
      '7 different numbers earns a bonus. First to 200 points wins.',
    ],
  },
  trio: {
    bs: [
      'Otkrivaš najnižu ili najvišu kartu iz bilo čije ruke, ili kartu iz sredine.',
      'Dok se otkrivene karte poklapaju, nastavljaš; tri iste = trio.',
      'Promašaj vraća karte i završava tvoj potez.',
      'Skupi 3 tria (ili zgrabi trio sedmica). U Ljutom modu treba dva povezana tria.',
    ],
    en: [
      'Reveal the lowest or highest card from any hand, or a card from the middle.',
      'While the revealed cards match, keep going; three of a kind is a trio.',
      'A mismatch returns the cards and ends your turn.',
      'Collect 3 trios (or grab the 7-trio). Spicy mode needs two connected trios.',
    ],
  },
}
