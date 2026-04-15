/**
 * Temporary instructor list until GET /instructors (or equivalent) is available.
 * id = instructor_user_id used as instructorId on lessons API.
 */
export const MOCK_INSTRUCTORS = [
  { id: 1, fullName: 'Abbasli, Nijat' },
  { id: 2, fullName: 'Abizada, Azar' },
  { id: 3, fullName: 'Abushov, Kavus' },
  { id: 4, fullName: 'Ahmadov, Mahmud' },
  { id: 5, fullName: 'Aliyev, Azar' },
  { id: 6, fullName: 'Aliyev, Rashad' },
  { id: 7, fullName: 'Aliyev, Ruslan' },
  { id: 8, fullName: 'Allazov, Elvin' },
  { id: 9, fullName: 'Babayeva, Kamala' },
  { id: 10, fullName: 'Babazade, Amin' },
  { id: 11, fullName: 'Bakhshaliyeva, Aydan' },
  { id: 12, fullName: 'Bandad, Aysel' },
  { id: 13, fullName: 'Bodewes, Wynand' },
  { id: 14, fullName: 'Brankovic, Azra' },
  { id: 15, fullName: 'Burns, John Thomas' },
  { id: 16, fullName: 'Eyvazov, Elnur' },
  { id: 17, fullName: 'Guluzada, Lala' },
  { id: 18, fullName: 'Gunesh, Ali' },
  { id: 19, fullName: 'Gurbanov, Sarvar' },
  { id: 20, fullName: 'Guvvatli, Fidan' },
  { id: 21, fullName: 'Hajisoy, Minura' },
  { id: 22, fullName: 'Hajizada, Samir' },
  { id: 23, fullName: 'Hamelin, Nicolas' },
  { id: 24, fullName: 'Hasanov, Jamaladdin' },
  { id: 25, fullName: 'Hasanov, Vusal' },
  { id: 26, fullName: 'Hasanzada, Azar' },
  { id: 27, fullName: 'Heydarova, Nargiz' },
  { id: 28, fullName: 'Imanov, Nurlan' },
  { id: 29, fullName: 'Ismayilova, Gulzar' },
  { id: 30, fullName: 'Ismayilova, Kamila' },
  { id: 31, fullName: 'Keskin, Kerim' },
  { id: 32, fullName: 'Maharramov, Ramil' },
  { id: 33, fullName: 'Mammadov, Orkhan' },
  { id: 34, fullName: 'Mammadov, Samir' },
  { id: 35, fullName: 'Mammadrzayev, Vusal' },
  { id: 36, fullName: 'Medvediev, Mykhailo' },
  { id: 37, fullName: 'Mirishov, Kamil' },
  { id: 38, fullName: 'Musayev, Vugar' },
  { id: 39, fullName: 'Nurmammadov, Elkin' },
  { id: 40, fullName: 'Rustamova, Narmina' },
  { id: 41, fullName: 'Sadili, Nuraddin' },
  { id: 42, fullName: 'Suleymanov, Umid' },
  { id: 43, fullName: 'Yeshilirmak, Muharrem' },
  { id: 44, fullName: 'Yusifzada, Tural' },
  { id: 45, fullName: 'Yusubov, Araz' },
]

export function instructorNameById(id) {
  const n = Number(id)
  const row = MOCK_INSTRUCTORS.find((i) => i.id === n)
  return row ? row.fullName : `Instructor #${id}`
}
