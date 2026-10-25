// Local suggestions, not a LinkedIn integration. Custom values remain supported.
export type Suggestion = { value: string; keywords?: string[] }

export const languageSuggestions: Suggestion[] = [
  ['Afrikaans', 'Afrikaans'], ['Albanian', 'Shqip'], ['Amharic', 'አማርኛ'], ['Arabic', 'العربية арабский'],
  ['Armenian', 'Հայերեն'], ['Azerbaijani', 'Azərbaycanca'], ['Basque', 'Euskara'], ['Belarusian', 'Беларуская'],
  ['Bengali', 'বাংলা'], ['Bosnian', 'Bosanski'], ['Bulgarian', 'Български'], ['Burmese', 'မြန်မာ'],
  ['Catalan', 'Català'], ['Chinese (Mandarin)', '中文 普通话 Mandarin китайский'], ['Chinese (Cantonese)', '廣東話 Cantonese'],
  ['Croatian', 'Hrvatski'], ['Czech', 'Čeština'], ['Danish', 'Dansk'], ['Dutch', 'Nederlands'],
  ['English', 'English английский אנגלית'], ['Estonian', 'Eesti'], ['Filipino', 'Filipino Tagalog'],
  ['Finnish', 'Suomi'], ['French', 'Français французский'], ['Georgian', 'ქართული'], ['German', 'Deutsch немецкий'],
  ['Greek', 'Ελληνικά'], ['Gujarati', 'ગુજરાતી'], ['Haitian Creole', 'Kreyòl'], ['Hebrew', 'עברית иврит'],
  ['Hindi', 'हिन्दी'], ['Hungarian', 'Magyar'], ['Icelandic', 'Íslenska'], ['Indonesian', 'Bahasa Indonesia'],
  ['Irish', 'Gaeilge'], ['Italian', 'Italiano итальянский'], ['Japanese', '日本語 японский'], ['Kannada', 'ಕನ್ನಡ'],
  ['Kazakh', 'Қазақша'], ['Khmer', 'ខ្មែរ'], ['Korean', '한국어 корейский'], ['Kurdish', 'Kurdî'],
  ['Kyrgyz', 'Кыргызча'], ['Lao', 'ລາວ'], ['Latvian', 'Latviešu'], ['Lithuanian', 'Lietuvių'],
  ['Macedonian', 'Македонски'], ['Malay', 'Bahasa Melayu'], ['Malayalam', 'മലയാളം'], ['Maltese', 'Malti'],
  ['Marathi', 'मराठी'], ['Mongolian', 'Монгол'], ['Nepali', 'नेपाली'], ['Norwegian', 'Norsk'],
  ['Pashto', 'پښتو'], ['Persian', 'فارسی Farsi'], ['Polish', 'Polski польский'], ['Portuguese', 'Português'],
  ['Punjabi', 'ਪੰਜਾਬੀ'], ['Romanian', 'Română'], ['Russian', 'Русский רוסית'], ['Serbian', 'Српски'],
  ['Sinhala', 'සිංහල'], ['Slovak', 'Slovenčina'], ['Slovenian', 'Slovenščina'], ['Somali', 'Soomaali'],
  ['Spanish', 'Español испанский'], ['Swahili', 'Kiswahili'], ['Swedish', 'Svenska'], ['Tamil', 'தமிழ்'],
  ['Telugu', 'తెలుగు'], ['Thai', 'ไทย'], ['Turkish', 'Türkçe турецкий'], ['Ukrainian', 'Українська украинский'],
  ['Urdu', 'اردو'], ['Uzbek', 'Oʻzbekcha'], ['Vietnamese', 'Tiếng Việt'], ['Welsh', 'Cymraeg'], ['Zulu', 'isiZulu'],
].map(([value, native]) => ({ value, keywords: [native] }))

export const skillSuggestions: Suggestion[] = [
  'Communication', 'Leadership', 'Project management', 'Problem solving', 'Teamwork', 'Time management',
  'Customer service', 'Sales', 'Negotiation', 'Strategic planning', 'Data analysis', 'Microsoft Excel',
  'SQL', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'Git',
  'Product management', 'Agile', 'Scrum', 'UX research', 'UI design', 'Figma', 'User testing',
  'Digital marketing', 'SEO', 'Content strategy', 'Copywriting', 'Financial analysis', 'Accounting',
  'Operations management', 'Recruiting', 'Business development', 'Public speaking', 'Research',
].map((value) => ({ value }))

export const degreeSuggestions: Suggestion[] = [
  'High School Diploma', 'Associate of Arts (AA)', 'Associate of Science (AS)',
  'Bachelor of Arts (BA)', 'Bachelor of Science (BSc)', 'Bachelor of Engineering (BEng)',
  'Bachelor of Business Administration (BBA)', 'Master of Arts (MA)', 'Master of Science (MSc)',
  'Master of Business Administration (MBA)', 'Master of Engineering (MEng)',
  'Doctor of Philosophy (PhD)', 'Doctor of Medicine (MD)', 'Juris Doctor (JD)',
  'Diploma', 'Professional Certificate',
].map((value) => ({ value }))

export function sameChoice(a: string, b: string) {
  return a.trim().normalize('NFKC').toLowerCase() === b.trim().normalize('NFKC').toLowerCase()
}

export const jobTitleSuggestions: Suggestion[] = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Product Manager', 'Project Manager', 'Product Designer', 'UX Designer', 'UI Designer',
  'Data Analyst', 'Data Scientist', 'Business Analyst', 'Marketing Manager', 'Sales Manager',
  'Account Manager', 'Customer Success Manager', 'Operations Manager', 'Human Resources Manager',
  'Recruiter', 'Financial Analyst', 'Accountant', 'Researcher', 'Consultant',
].map((value) => ({ value }))

export const employmentSuggestions: Suggestion[] = [
  'Full-time', 'Part-time', 'Self-employed', 'Freelance', 'Contract', 'Internship', 'Apprenticeship', 'Seasonal',
].map((value) => ({ value }))

export function suggestionsFrom(values: string[]): Suggestion[] {
  const unique: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (trimmed && !unique.some((existing) => sameChoice(existing, trimmed))) unique.push(trimmed)
  }
  return unique.sort((a, b) => a.localeCompare(b)).map((value) => ({ value }))
}
