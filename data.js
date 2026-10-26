// code | nom | capitale | continent | niveau (1 = célèbre, 2 = connu, 3 = rare)
const RAW = `
al|Albanie|Tirana|Europe|2
de|Allemagne|Berlin|Europe|1
ad|Andorre|Andorre-la-Vieille|Europe|3
at|Autriche|Vienne|Europe|1
be|Belgique|Bruxelles|Europe|1
by|Biélorussie|Minsk|Europe|2
ba|Bosnie-Herzégovine|Sarajevo|Europe|2
bg|Bulgarie|Sofia|Europe|2
cy|Chypre|Nicosie|Europe|2
hr|Croatie|Zagreb|Europe|2
dk|Danemark|Copenhague|Europe|1
es|Espagne|Madrid|Europe|1
ee|Estonie|Tallinn|Europe|2
fi|Finlande|Helsinki|Europe|1
fr|France|Paris|Europe|1
gr|Grèce|Athènes|Europe|1
hu|Hongrie|Budapest|Europe|2
ie|Irlande|Dublin|Europe|1
is|Islande|Reykjavik|Europe|2
it|Italie|Rome|Europe|1
xk|Kosovo|Pristina|Europe|3
lv|Lettonie|Riga|Europe|2
li|Liechtenstein|Vaduz|Europe|3
lt|Lituanie|Vilnius|Europe|2
lu|Luxembourg|Luxembourg|Europe|2
mk|Macédoine du Nord|Skopje|Europe|2
mt|Malte|La Valette|Europe|2
md|Moldavie|Chișinău|Europe|3
mc|Monaco|Monaco|Europe|2
me|Monténégro|Podgorica|Europe|3
no|Norvège|Oslo|Europe|1
nl|Pays-Bas|Amsterdam|Europe|1
pl|Pologne|Varsovie|Europe|1
pt|Portugal|Lisbonne|Europe|1
cz|Tchéquie|Prague|Europe|2
ro|Roumanie|Bucarest|Europe|2
gb|Royaume-Uni|Londres|Europe|1
ru|Russie|Moscou|Europe|1
sm|Saint-Marin|Saint-Marin|Europe|3
rs|Serbie|Belgrade|Europe|2
sk|Slovaquie|Bratislava|Europe|2
si|Slovénie|Ljubljana|Europe|2
se|Suède|Stockholm|Europe|1
ch|Suisse|Berne|Europe|1
ua|Ukraine|Kyiv|Europe|1
va|Vatican|Vatican|Europe|3
af|Afghanistan|Kaboul|Asie|2
sa|Arabie saoudite|Riyad|Asie|1
am|Arménie|Erevan|Asie|2
az|Azerbaïdjan|Bakou|Asie|2
bh|Bahreïn|Manama|Asie|3
bd|Bangladesh|Dacca|Asie|2
bt|Bhoutan|Thimphou|Asie|3
mm|Birmanie|Naypyidaw|Asie|3
bn|Brunei|Bandar Seri Begawan|Asie|3
kh|Cambodge|Phnom Penh|Asie|2
cn|Chine|Pékin|Asie|1
kp|Corée du Nord|Pyongyang|Asie|2
kr|Corée du Sud|Séoul|Asie|1
ae|Émirats arabes unis|Abou Dabi|Asie|2
ge|Géorgie|Tbilissi|Asie|2
in|Inde|New Delhi|Asie|1
id|Indonésie|Jakarta|Asie|2
iq|Irak|Bagdad|Asie|2
ir|Iran|Téhéran|Asie|2
il|Israël|Jérusalem (contestée)|Asie|1
jp|Japon|Tokyo|Asie|1
jo|Jordanie|Amman|Asie|2
kz|Kazakhstan|Astana|Asie|2
kg|Kirghizistan|Bichkek|Asie|3
kw|Koweït|Koweït|Asie|3
la|Laos|Vientiane|Asie|3
lb|Liban|Beyrouth|Asie|2
my|Malaisie|Kuala Lumpur|Asie|2
mv|Maldives|Malé|Asie|3
mn|Mongolie|Oulan-Bator|Asie|3
np|Népal|Katmandou|Asie|2
om|Oman|Mascate|Asie|3
uz|Ouzbékistan|Tachkent|Asie|3
pk|Pakistan|Islamabad|Asie|2
ps|Palestine|Ramallah (administrative)|Asie|2
ph|Philippines|Manille|Asie|2
qa|Qatar|Doha|Asie|2
sg|Singapour|Singapour|Asie|2
lk|Sri Lanka|Sri Jayawardenapura Kotte|Asie|2
sy|Syrie|Damas|Asie|2
tj|Tadjikistan|Douchanbé|Asie|3
tw|Taïwan|Taipei|Asie|2
th|Thaïlande|Bangkok|Asie|2
tl|Timor oriental|Dili|Asie|3
tm|Turkménistan|Achgabat|Asie|3
tr|Turquie|Ankara|Asie|1
vn|Viêt Nam|Hanoï|Asie|2
ye|Yémen|Sanaa|Asie|3
za|Afrique du Sud|Pretoria|Afrique|1
dz|Algérie|Alger|Afrique|1
ao|Angola|Luanda|Afrique|2
bj|Bénin|Porto-Novo|Afrique|3
bw|Botswana|Gaborone|Afrique|3
bf|Burkina Faso|Ouagadougou|Afrique|2
bi|Burundi|Gitega|Afrique|3
cm|Cameroun|Yaoundé|Afrique|2
cv|Cap-Vert|Praia|Afrique|3
cf|Centrafrique|Bangui|Afrique|3
km|Comores|Moroni|Afrique|3
cg|Congo|Brazzaville|Afrique|3
cd|RD Congo|Kinshasa|Afrique|2
ci|Côte d'Ivoire|Yamoussoukro|Afrique|2
dj|Djibouti|Djibouti|Afrique|3
eg|Égypte|Le Caire|Afrique|1
er|Érythrée|Asmara|Afrique|3
sz|Eswatini|Mbabane|Afrique|3
et|Éthiopie|Addis-Abeba|Afrique|2
ga|Gabon|Libreville|Afrique|2
gm|Gambie|Banjul|Afrique|3
gh|Ghana|Accra|Afrique|2
gn|Guinée|Conakry|Afrique|2
gw|Guinée-Bissau|Bissau|Afrique|3
gq|Guinée équatoriale|Malabo|Afrique|3
ke|Kenya|Nairobi|Afrique|2
ls|Lesotho|Maseru|Afrique|3
lr|Liberia|Monrovia|Afrique|3
ly|Libye|Tripoli|Afrique|2
mg|Madagascar|Antananarivo|Afrique|2
mw|Malawi|Lilongwe|Afrique|3
ml|Mali|Bamako|Afrique|2
ma|Maroc|Rabat|Afrique|1
mu|Maurice|Port-Louis|Afrique|3
mr|Mauritanie|Nouakchott|Afrique|3
mz|Mozambique|Maputo|Afrique|3
na|Namibie|Windhoek|Afrique|3
ne|Niger|Niamey|Afrique|2
ng|Nigeria|Abuja|Afrique|1
ug|Ouganda|Kampala|Afrique|3
rw|Rwanda|Kigali|Afrique|3
st|Sao Tomé-et-Principe|São Tomé|Afrique|3
sn|Sénégal|Dakar|Afrique|1
sc|Seychelles|Victoria|Afrique|3
sl|Sierra Leone|Freetown|Afrique|3
so|Somalie|Mogadiscio|Afrique|3
sd|Soudan|Khartoum|Afrique|3
ss|Soudan du Sud|Djouba|Afrique|3
tz|Tanzanie|Dodoma|Afrique|3
td|Tchad|N'Djaména|Afrique|2
tg|Togo|Lomé|Afrique|3
tn|Tunisie|Tunis|Afrique|1
zm|Zambie|Lusaka|Afrique|3
zw|Zimbabwe|Harare|Afrique|3
ag|Antigua-et-Barbuda|Saint John's|Amérique|3
ar|Argentine|Buenos Aires|Amérique|1
bs|Bahamas|Nassau|Amérique|3
bb|Barbade|Bridgetown|Amérique|3
bz|Belize|Belmopan|Amérique|3
bo|Bolivie|Sucre|Amérique|2
br|Brésil|Brasília|Amérique|1
ca|Canada|Ottawa|Amérique|1
cl|Chili|Santiago|Amérique|1
co|Colombie|Bogota|Amérique|2
cr|Costa Rica|San José|Amérique|2
cu|Cuba|La Havane|Amérique|1
dm|Dominique|Roseau|Amérique|3
ec|Équateur|Quito|Amérique|2
us|États-Unis|Washington|Amérique|1
gd|Grenade|Saint-Georges|Amérique|3
gt|Guatemala|Guatemala|Amérique|2
gy|Guyana|Georgetown|Amérique|3
ht|Haïti|Port-au-Prince|Amérique|2
hn|Honduras|Tegucigalpa|Amérique|3
jm|Jamaïque|Kingston|Amérique|1
mx|Mexique|Mexico|Amérique|1
ni|Nicaragua|Managua|Amérique|3
pa|Panama|Panama|Amérique|2
py|Paraguay|Asuncion|Amérique|2
pe|Pérou|Lima|Amérique|2
do|République dominicaine|Saint-Domingue|Amérique|2
kn|Saint-Christophe-et-Niévès|Basseterre|Amérique|3
lc|Sainte-Lucie|Castries|Amérique|3
vc|Saint-Vincent-et-les-Grenadines|Kingstown|Amérique|3
sv|Salvador|San Salvador|Amérique|3
sr|Suriname|Paramaribo|Amérique|3
tt|Trinité-et-Tobago|Port-d'Espagne|Amérique|3
uy|Uruguay|Montevideo|Amérique|2
ve|Venezuela|Caracas|Amérique|2
au|Australie|Canberra|Océanie|1
fj|Fidji|Suva|Océanie|3
ki|Kiribati|Tarawa-Sud|Océanie|3
mh|Îles Marshall|Majuro|Océanie|3
fm|Micronésie|Palikir|Océanie|3
nr|Nauru|Yaren|Océanie|3
nz|Nouvelle-Zélande|Wellington|Océanie|1
pw|Palaos|Ngerulmud|Océanie|3
pg|Papouasie-Nouvelle-Guinée|Port Moresby|Océanie|3
sb|Îles Salomon|Honiara|Océanie|3
ws|Samoa|Apia|Océanie|3
to|Tonga|Nuku'alofa|Océanie|3
tv|Tuvalu|Funafuti|Océanie|3
vu|Vanuatu|Port-Vila|Océanie|3
`;

const COUNTRIES = RAW.trim().split("\n").map(l => {
  const [code, name, capital, continent, tier] = l.split("|");
  return { code, name, capital, continent, tier: +tier };
});

// Autres réponses acceptées en saisie libre
const ALIASES = {
  us: ["usa", "etats unis d amerique", "amerique"],
  gb: ["uk", "grande bretagne", "angleterre"],
  ae: ["emirats", "eau", "emirats arabes"],
  cd: ["rdc", "republique democratique du congo", "congo kinshasa", "zaire"],
  cg: ["congo brazzaville", "republique du congo"],
  ci: ["ivory coast"],
  mm: ["myanmar"],
  cz: ["republique tcheque"],
  mk: ["macedoine"],
  sz: ["swaziland"],
  tl: ["timor leste"],
  cf: ["republique centrafricaine"],
  va: ["saint siege", "cite du vatican"],
  nl: ["hollande"],
  by: ["belarus"],
  ba: ["bosnie"],
  vn: ["vietnam"],
  kn: ["saint kitts et nevis"],
  st: ["sao tome"],
  fm: ["etats federes de micronesie"],
  pw: ["palau"],
  sv: ["el salvador"],
  tt: ["trinidad et tobago"],
  md: ["moldova"],
  kg: ["kirghizie"],
  mh: ["marshall"],
  sb: ["salomon"],
  ps: ["etat de palestine"],
  kr: ["coree"],
  bs: ["iles bahamas"],
  mv: ["iles maldives"],
  cv: ["cabo verde"],
};

// Drapeaux qui se ressemblent : les pièges du niveau difficile
const LOOKALIKES = [
  ["td", "ro", "ad", "md"],
  ["id", "mc", "pl", "sg"],
  ["nl", "lu", "py", "hr", "fr"],
  ["ie", "ci", "it", "mx", "ne", "in"],
  ["au", "nz", "fj", "tv"],
  ["no", "is", "dk", "fi", "se"],
  ["sn", "ml", "gn", "cm"],
  ["ru", "si", "sk", "rs"],
  ["ve", "ec", "co"],
  ["hn", "ni", "sv", "gt", "ar", "uy"],
  ["jo", "ps", "sd", "ae", "kw"],
  ["eg", "iq", "ye", "sy"],
  ["lv", "at", "lb"],
  ["tn", "tr"],
  ["cn", "vn"],
  ["bd", "jp", "pw"],
  ["lt", "bo", "gh", "mm", "et", "gw"],
  ["us", "lr", "my"],
  ["hu", "bg", "ir", "tj"],
  ["mr", "pk", "dz"],
  ["qa", "bh"],
  ["ht", "li"],
  ["be", "de"],
  ["cl", "cu", "cz", "ph"],
  ["ga", "sl"],
  ["za", "vu"],
  ["kz", "pw"],
  ["ng", "ne"],
  ["bj", "td", "gw"],
  ["ug", "ke", "tz"],
  ["ee", "bw"],
  ["zm", "zw", "mw"],
  ["lc", "dm", "gd", "kn"],
  ["mk", "kg"],
  ["ke", "ss", "sd"],
  ["cg", "tz", "sc"],
];
