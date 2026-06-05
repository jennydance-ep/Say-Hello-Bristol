// Bristol place name pronunciation data.
// To add a new entry, copy an existing block and fill in the fields.
// id: lowercase name with hyphens (matches the audio filename)
// outsideCity: true = show a directional arrow at map edge instead of a pin

const PLACES = [
  {
    "id": "clifton",
    "name": "Clifton",
    "category": "Districts & Neighbourhoods",
    "ipa": "ˈklɪf.tən",
    "teachingNote": "Say KLIF-tən with a short /ɪ/ sound in syllable 1.",
    "extraNote": "Known for beautiful buildings, and some very smart shops, cafes and restaurants.",
    "audio": "audio/clifton.mp4"
  },
  {
    "id": "clevedon",
    "name": "Clevedon",
    "category": "Transport & Surrounding Towns",
    "ipa": "ˈkliːv.dən",
    "teachingNote": "Say KLEEV-dən with a long /iː/ sound in syllable 1.",
    "extraNote": "A Victorian seaside town about 35 mins drive from Bristol, has a marine lake for swimming.",
    "audio": "audio/clevedon.mp4",
    "outsideCity": true
  },
  {
    "id": "the-downs",
    "name": "The Downs",
    "category": "Districts & Neighbourhoods",
    "ipa": "ðə ˈdaʊnz",
    "teachingNote": "This place includes a diphthong - two vowel sounds pushed together into one phoneme - as the vowel in DOWNS. The final 's' is pronounced /z/.",
    "extraNote": "Open grassy space for walking and picnics - great views over the Avon Gorge - located at the top of Whiteladies Road in Clifton.",
    "audio": "audio/the-downs.mp4"
  },
  {
    "id": "cabot-circus",
    "name": "Cabot Circus",
    "category": "Landmarks & Destinations",
    "ipa": "ˌkæb.ət ˈsɜː.kəs",
    "teachingNote": "The strongest syllable is the first one in circus - say ka-bət SIR-kəs",
    "extraNote": "Bristol's central shopping district - shops, cafes and a cinema.",
    "audio": "audio/cabot-circus.mp4"
  },
  {
    "id": "ashton-court",
    "name": "Ashton Court",
    "category": "Landmarks & Destinations",
    "ipa": "ˌæʃt.ən ˈkɔːt",
    "teachingNote": "The strongest beat falls on COURT - say ash-tən COURT",
    "extraNote": "Great place for an open-air walk, also has deer park.",
    "audio": "audio/ashton-court.mp4"
  },
  {
    "id": "the-harbourside",
    "name": "The Harbourside",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˈhɑː.bə.saɪd",
    "teachingNote": "Use the weak form of 'the', which ends in the schwa vowel; the 'r's are silent, the HAH-bə-side",
    "extraNote": "This lively area has cafes, restaurants, bars, galleries and museums - all around the harbour in the middle of Bristol.",
    "audio": "audio/the-harbourside.mp4"
  },
  {
    "id": "ashton-gate",
    "name": "Ashton Gate",
    "category": "Landmarks & Destinations",
    "ipa": "ˌæʃt.ən ˈɡeɪt",
    "teachingNote": "Say ash-tən GATE, with the stress on the second word",
    "extraNote": "Sports stadium - home of Bristol City FC and Bristol Bears rugby club.",
    "audio": "audio/ashton-gate.mp4"
  },
  {
    "id": "gloucester-road",
    "name": "Gloucester Road",
    "category": "Streets & Roads",
    "ipa": "ˌɡlɒs.tə ˈrəʊd",
    "teachingNote": "Make ROAD the strongest part of this phrase: glos-tə ROAD",
    "extraNote": "High street with lots of independent shops and cafes in North Bristol - a great place to go for a stroll among the locals.",
    "audio": "audio/gloucester-road.mp4"
  },
  {
    "id": "the-river-avon",
    "name": "The River Avon",
    "category": "River & Geography",
    "ipa": "ðə ˌrɪv.ər ˈeɪ.vən",
    "teachingNote": "There are 3 schwa /ə/ sounds here - and we say the /r/ at the end of river because the next word starts with a vowel: thə riv-ər AY-vən",
    "extraNote": "River which runs through Bristol, feeding into the Avon Gorge (the Clifton Suspension Bridge joins one side of the gorge to the other).",
    "audio": "audio/the-river-avon.mp4"
  },
  {
    "id": "bath",
    "name": "Bath",
    "category": "Transport & Surrounding Towns",
    "ipa": "",
    "teachingNote": "",
    "extraNote": "",
    "audio": "audio/bath.mp4",
    "outsideCity": true
  },
  {
    "id": "weston-super-mare",
    "name": "Weston-super-Mare",
    "category": "Transport & Surrounding Towns",
    "ipa": "",
    "teachingNote": "",
    "extraNote": "",
    "audio": "audio/weston-super-mare.mp4",
    "outsideCity": true
  },
  {
    "id": "portishead",
    "name": "Portishead",
    "category": "Transport & Surrounding Towns",
    "ipa": "",
    "teachingNote": "",
    "extraNote": "",
    "audio": "audio/portishead.mp4",
    "outsideCity": true
  },
  {
    "id": "bristol-airport",
    "name": "Bristol Airport",
    "category": "Transport & Surrounding Towns",
    "ipa": "",
    "teachingNote": "",
    "extraNote": "",
    "audio": "audio/bristol-airport.mp4",
    "outsideCity": true
  },
  {
    "id": "bristol-beacon",
    "name": "Bristol Beacon",
    "category": "Landmarks & Destinations",
    "ipa": "",
    "teachingNote": "Stress the first syllable of 'Beacon' - say: bris-təl BEE-kən",
    "extraNote": "Bristol's main concert hall, a mix of Victorian and modern architecture - hosts classical, modern music and comedy performances.",
    "audio": "audio/bristol-beacon.mp4"
  },
  {
    "id": "clifton-suspension-bridge",
    "name": "Clifton Suspension Bridge",
    "category": "Landmarks & Destinations",
    "ipa": "",
    "teachingNote": "The strongest beat is on the second syllable of 'suspension' - say: klɪf-tən səs-PEN-shən bridge",
    "extraNote": "Iconic Bristol landmark, designed by Isambard Kingdom Brunel, finished in 1864 - sits across the Avon Gorge.",
    "audio": "audio/clifton-suspension-bridge.mp4"
  },
  {
    "id": "the-wills-memorial-building",
    "name": "The Wills Memorial Building",
    "category": "Landmarks & Destinations",
    "ipa": "",
    "teachingNote": "'Memorial' has the strongest beat in this phrase - say: thə wɪlz mə-MAW-ri-əl BIL-dɪŋ",
    "extraNote": "The centrepiece building of the University of Bristol campus - a magnificent 1925 neo-Gothic tower.",
    "audio": "audio/the-wills-memorial-building.mp4"
  },
  {
    "id": "millennium-square",
    "name": "Millennium Square",
    "category": "Landmarks & Destinations",
    "ipa": "",
    "teachingNote": "In this phrase, SQUARE is the stressed syllable - say: mɪl-en-i-əm SKWAIR, with the /eə/ diphthong at the end",
    "extraNote": "Large open public space in the Harbourside area, with cafes, bars and the We The Curious science museum - hosts outdoor events, markets and festivals.",
    "audio": "audio/millennium-square.mp4"
  },
  {
    "id": "brandon-hill",
    "name": "Brandon Hill",
    "category": "Landmarks & Destinations",
    "ipa": "",
    "teachingNote": "Make HILL the strongest part of this phrase - say: bran-dən HILL",
    "extraNote": "One of Bristol's oldest public parks, home to Cabot Tower - a Victorian monument with panoramic views over the city. Free to visit and a great spot for a picnic.",
    "audio": "audio/brandon-hill.mp4"
  },
  {
    "id": "ss-great-britain",
    "name": "SS Great Britain",
    "category": "Landmarks & Destinations",
    "ipa": "",
    "teachingNote": "Say each of the first letters separately: ESS-ESS, with the main stress on the first syllable of 'Britain': ess-ess GRAYT BRI-tən",
    "extraNote": "The world's first ocean-going propeller-driven iron ship, designed by Brunel and launched in 1843 - now restored and on permanent display in the Great Western Dockyard where she was built.",
    "audio": "audio/ss-great-britain.mp4"
  },
  {
    "id": "whiteladies-road",
    "name": "Whiteladies Road",
    "category": "Streets & Roads",
    "ipa": "",
    "teachingNote": "The stress is on the word 'Road' - say: WITE-lay-deez RODE",
    "extraNote": "Connects Clifton to the city centre, lined with restaurants, cafes, bars and independent shops - one of Bristol's most popular streets for eating out and socialising.",
    "audio": "audio/whiteladies-road.mp4"
  }
];
