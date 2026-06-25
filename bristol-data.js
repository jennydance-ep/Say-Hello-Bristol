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
    "ipa": "bɑːθ",
    "teachingNote": "A single syllable with a long vowel, rhymes with 'path', 'car' and 'far'.",
    "extraNote": "Beautiful Georgian city just 15 minutes from Bristol by train - famous for its Roman Baths and stunning honey-coloured stone architecture. A UNESCO World Heritage Site.",
    "audio": "audio/bath.mp4",
    "outsideCity": true
  },
  {
    "id": "weston-super-mare",
    "name": "Weston-super-Mare",
    "category": "Transport & Surrounding Towns",
    "ipa": "ˌwes.tən ˈsuː.pə meə",
    "teachingNote": "This place name is stressed on the first syllable of 'super', say: wes-tən SOO-pə mair. 'Super-Mare' is Latin meaning 'on sea'.",
    "extraNote": "Traditional English seaside town about 40 minutes from Bristol - famous for its sandy beach, Grand Pier and as the birthplace of Banksy. A popular day trip destination.",
    "audio": "audio/weston-super-mare.mp4",
    "outsideCity": true
  },
  {
    "id": "portishead",
    "name": "Portishead",
    "category": "Transport & Surrounding Towns",
    "ipa": "ˈpɔːt.ɪs.hed",
    "teachingNote": "Say PORT-is-hed - although there is an 'sh' in the spelling, we say these sounds separately here.",
    "extraNote": "Coastal town 12 miles west of Bristol, famous as the birthplace of the trip-hop band of the same name - has a lovely waterfront with restaurants and a marina.",
    "audio": "audio/portishead.mp4",
    "outsideCity": true
  },
  {
    "id": "bristol-airport",
    "name": "Bristol Airport",
    "category": "Transport & Surrounding Towns",
    "ipa": "ˌbrɪs.təl ˈeə.pɔːt",
    "teachingNote": "Stress the second word here, say: bris-təl AIR-port.",
    "extraNote": "Bristol's international airport, located south of the city - serves over 100 destinations across Europe and beyond.",
    "audio": "audio/bristol-airport.mp4",
    "outsideCity": true
  },
  {
    "id": "bristol-beacon",
    "name": "Bristol Beacon",
    "category": "Landmarks & Destinations",
    "ipa": "ˌbrɪs.təl ˈbiː.kən",
    "teachingNote": "Stress the first syllable of 'Beacon' - say: bris-təl BEE-kən",
    "extraNote": "Bristol's main concert hall, a mix of Victorian and modern architecture - hosts classical, modern music and comedy performances.",
    "audio": "audio/bristol-beacon.mp4"
  },
  {
    "id": "clifton-suspension-bridge",
    "name": "Clifton Suspension Bridge",
    "category": "Landmarks & Destinations",
    "ipa": "ˈklɪf.tən səˈspen.ʃən ˌbrɪdʒ",
    "teachingNote": "The strongest beat is on the second syllable of 'suspension' - say: klɪf-tən səs-PEN-shən bridge",
    "extraNote": "Iconic Bristol landmark, designed by Isambard Kingdom Brunel, finished in 1864 - sits across the Avon Gorge.",
    "audio": "audio/clifton-suspension-bridge.mp4"
  },
  {
    "id": "the-wills-memorial-building",
    "name": "The Wills Memorial Building",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˈwɪlz məˈmɔː.ri.əl ˌbɪl.dɪŋ",
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
    "ipa": "ˌbræn.dən ˈhɪl",
    "teachingNote": "Make HILL the strongest part of this phrase - say: bran-dən HILL",
    "extraNote": "One of Bristol's oldest public parks, home to Cabot Tower - a Victorian monument with panoramic views over the city. Free to visit and a great spot for a picnic.",
    "audio": "audio/brandon-hill.mp4"
  },
  {
    "id": "ss-great-britain",
    "name": "SS Great Britain",
    "category": "Landmarks & Destinations",
    "ipa": "ˌes.es ˈɡreɪt ˈbrɪt.ən",
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
  },
  {
    "id": "cribbs-causeway",
    "name": "Cribbs Causeway",
    "category": "Landmarks & Destinations",
    "ipa": "ˌkrɪbz ˈkɔːz.weɪ",
    "teachingNote": "Stress the first syllable of 'Causeway' - say: kribs KAWZ-way. The 'au' in Causeway sounds like the word 'or'.",
    "extraNote": "Large out-of-town shopping centre north of Bristol, near junction 17 of the M5 - home to over 130 shops, free parking.",
    "audio": "audio/cribbs-causeway.mp4"
  },
  {
    "id": "the-hippodrome",
    "name": "The Hippodrome",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˈhɪp.ə.drəʊm",
    "teachingNote": "Say: thə HIP-ə-drohm. The final syllable rhymes with 'home'.",
    "extraNote": "Well known Bristol theatre venue, opened in 1912 - hosts West End touring productions, opera, ballet and pantomime.",
    "audio": "audio/the-hippodrome.mp4"
  },
  {
    "id": "uwe",
    "name": "UWE",
    "category": "Landmarks & Destinations",
    "ipa": "ˈjuː.wiː",
    "teachingNote": "This acronym of The University of the West of England is shortened to UWE and pronounced YOU-wee.",
    "extraNote": "One of Bristol's two universities, with campuses in the north and south of the city - home to around 30,000 students.",
    "audio": "audio/uwe.mp4"
  },
  {
    "id": "the-university-of-bristol",
    "name": "The University of Bristol",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˌjuː.nɪˈvɜː.sə.ti əv ˈbrɪs.təl",
    "teachingNote": "This phrase has two stressed syllables - say: thə uni-VER-si-tee əv BRIS-təl",
    "extraNote": "A Russell Group university founded in 1909, with a beautiful campus in Clifton - consistently ranked in the UK top 10.",
    "audio": "audio/the-university-of-bristol.mp4"
  },
  {
    "id": "christmas-steps",
    "name": "Christmas Steps",
    "category": "Streets & Roads",
    "ipa": "ˌkrɪs.məs ˈsteps",
    "teachingNote": "The main stress is on Steps - say: kris-məs STEPS",
    "extraNote": "One of Bristol's most historic streets - a medieval stepped lane dating from 1669, lined with antique shops and independent traders.",
    "audio": "audio/christmas-steps.mp4"
  },
  {
    "id": "cheltenham-road",
    "name": "Cheltenham Road",
    "category": "Streets & Roads",
    "ipa": "ˌtʃelt.nəm ˈrəʊd",
    "teachingNote": "The first word has just two syllables, and the main stress is on Road: chelt-nəm ROAD",
    "extraNote": "Continuation of Gloucester Road, heading into town; a lively stretch with independent shops, cafes and music venues, popular with students and young professionals.",
    "audio": "audio/cheltenham-road.mp4"
  },
  {
    "id": "bristol-parkway",
    "name": "Bristol Parkway",
    "category": "Transport & Surrounding Towns",
    "ipa": "ˌbrɪs.təl ˈpɑːk.weɪ",
    "teachingNote": "Stress falls on the first syllable of Parkway, say: bris-təl PARK-way",
    "extraNote": "Bristol's second mainline railway station in the north of the city, with direct services to London Paddington - often quicker than from Temple Meads.",
    "audio": "audio/bristol-parkway.mp4"
  },
  {
    "id": "bristol-temple-meads",
    "name": "Bristol Temple Meads",
    "category": "Transport & Surrounding Towns",
    "ipa": "ˌbrɪs.təl ˌtem.pəl ˈmiːdz",
    "teachingNote": "The stress is on the final word here, say: bris-təl tem-pəl MEEDZ.",
    "extraNote": "Bristol's main railway station and one of the oldest in the world - features the beautiful Brunel-designed original terminus building.",
    "audio": "audio/bristol-temple-meads.mp4"
  },
  {
    "id": "the-avon-gorge",
    "name": "The Avon Gorge",
    "category": "River & Geography",
    "ipa": "ði ˌeɪ.vən ˈɡɔːdʒ",
    "teachingNote": "The is pronounced 'thee' here, because the next word starts with a vowel, say: thee ay-vən GORJ.",
    "extraNote": "The dramatic limestone gorge carved by the River Avon - home to the Clifton Suspension Bridge and Leigh Woods, with stunning walking trails and views.",
    "audio": "audio/the-avon-gorge.mp4"
  },
  {
    "id": "leigh-woods",
    "name": "Leigh Woods",
    "category": "Landmarks & Destinations",
    "ipa": "ˌliː ˈwʊdz",
    "teachingNote": "'Leigh' is pronounced lee (the 'gh' is completely silent), and it rhymes with 'me'. Say lee WOODZ - the vowel in 'woods' is the same short vowel as in 'put'.",
    "extraNote": "Ancient woodland on the Somerset side of the Avon Gorge, managed by the National Trust - a beautiful escape from the city with miles of walking and cycling trails.",
    "audio": "audio/leigh-woods.mp4"
  },
  {
    "id": "stokes-croft",
    "name": "Stokes Croft",
    "category": "Districts & Neighbourhoods",
    "ipa": "ˌstəʊks ˈkrɒft",
    "teachingNote": "Say: stokes CROFT, with the stress on the second word. The vowel in Croft is like the short vowel in 'hot'.",
    "extraNote": "Vibrant, creative neighbourhood known as Bristol's 'cultural quarter' - famous for street art, independent shops, cafes and nightlife. A hub of Bristol's alternative scene.",
    "audio": "audio/stokes-croft.mp4"
  },
  {
    "id": "tourist-information-centre",
    "name": "Tourist Information Centre",
    "category": "Landmarks & Destinations",
    "ipa": "ˌtʊər.ɪst ˌɪn.fəˈmeɪ.ʃən ˌsen.tə",
    "teachingNote": "This phrase has secondary stresses on words one and three, but the main stress is on syllable three of in-fə-MAY-shən.",
    "extraNote": "Bristol's official visitor information point - staff can help with maps, accommodation, tours and everything you need to make the most of your visit.",
    "audio": "audio/tourist-information-centre.mp4"
  },
  {
    "id": "bristol-museum-and-art-gallery",
    "name": "Bristol Museum & Art Gallery",
    "category": "Landmarks & Destinations",
    "ipa": "ˌbrɪs.təl mjuːˌzi.əm ənd ˈɑːt ˌɡæl.ər.i",
    "teachingNote": "'Museum' has three syllables - with stress on the middle syllable. The first syllable rhymes with 'new', and the s is pronounced /z/ here: myoo-ZEE-əm",
    "extraNote": "Free to visit and right in the heart of the city - collections include dinosaur skeletons, ancient Egyptian artefacts, local art and a world-famous Banksy piece.",
    "audio": "audio/bristol-museum-and-art-gallery.mp4"
  },
  {
    "id": "m-shed",
    "name": "M Shed",
    "category": "Landmarks & Destinations",
    "ipa": "ˈem ˌʃed",
    "teachingNote": "Say the letter M as 'em' - that is where the main stress is in this name, so we say: EM-shed.",
    "extraNote": "Bristol's free museum of local life and history, right on the harbourside - explore the city's past through fascinating objects, photographs, film and personal stories.",
    "audio": "audio/m-shed.mp4"
  },
  {
    "id": "park-street",
    "name": "Park Street",
    "category": "Streets & Roads",
    "ipa": "ˈpɑːk ˈstriːt",
    "teachingNote": "Stress on 'Park' - say: PARK street. The vowel in 'park' is a long /ɑː/, like the vowel in 'car'.",
    "extraNote": "One of Bristol's most famous streets - a steep hill lined with independent shops, cafes and restaurants connecting the city centre to Clifton. Great views from the top.",
    "audio": "audio/park-street.mp4"
  },
  {
    "id": "king-street",
    "name": "King Street",
    "category": "Streets & Roads",
    "ipa": "ˈkɪŋ ˈstriːt",
    "teachingNote": "The stress on 'King' - say: KING street. The short /ɪ/ vowel in 'King' is the same as in the word 'sit'. The /ɪ/ vowel represents over 8% of all sounds in English!",
    "extraNote": "Historic street in the Old City, dating from the 17th century - home to the famous Llandoger Trow pub, the Bristol Old Vic theatre and several characterful bars and restaurants.",
    "audio": "audio/king-street.mp4"
  },
  {
    "id": "the-arnolfini",
    "name": "The Arnolfini",
    "category": "Landmarks & Destinations",
    "ipa": "ði ˌɑː.nɒlˈfɪ.ni",
    "teachingNote": "'The' is pronounced 'thee' here because the next word starts with a vowel. Stress on the third syllable of Arnolfini. Say: thee ah-nol-FEE-nee",
    "extraNote": "Bristol's internationally acclaimed contemporary arts centre on the Harbourside - galleries, cinema, performance space and a great cafe/bar. Named after the famous Van Eyck painting.",
    "audio": "audio/the-arnolfini.mp4"
  },
  {
    "id": "st-nicholas-market",
    "name": "St Nicholas Market",
    "category": "Landmarks & Destinations",
    "ipa": "ˌsənt ˈnɪk.ə.ləs ˈmɑː.kɪt",
    "teachingNote": "'Saint' is reduced to 'sənt' in natural speech - say: sənt nic-ə-ləs MAH-kət.",
    "extraNote": "Bristol's oldest and most characterful covered market, trading since 1743 in the heart of the Old City - a wonderful mix of street food, vintage goods, crafts and local produce.",
    "audio": "audio/st-nicholas-market.mp4"
  },
  {
    "id": "the-llandoger-trow",
    "name": "The Llandoger Trow",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˌɬæn.dɒ.ɡə ˈtraʊ",
    "teachingNote": "This Welsh-origin name is notoriously tricky - say thə lan-dog-ə TROW, (Trow rhymes with 'cow').",
    "extraNote": "One of Bristol's most historic pubs, dating from 1664 - reputedly the inspiration for the Admiral Benbow inn in Robert Louis Stevenson's Treasure Island.",
    "audio": "audio/the-llandoger-trow.mp4"
  },
  {
    "id": "the-avon-gorge-hotel",
    "name": "The Avon Gorge Hotel",
    "category": "Landmarks & Destinations",
    "ipa": "ði ˈeɪ.vən ɡɔːdʒ həʊˈtel",
    "teachingNote": "Note the stress in 'hotel' - say: hoh-TEL, with stress on the second syllable.",
    "extraNote": "Perched right on the edge of the Avon Gorge with breathtaking views of the Clifton Suspension Bridge - the bar and terrace are worth a visit even if you're not staying.",
    "audio": "audio/the-avon-gorge-hotel.mp4"
  },
  {
    "id": "the-coronation-tap",
    "name": "The Coronation Tap",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˌkɒr.əˈneɪ.ʃən ˈtæp",
    "teachingNote": "Four syllables in 'Coronation' - say kor-ə-NAY-shən, with the stress on the third syllable. This pub is known locally as 'The Cori (KO-ree) Tap'.",
    "extraNote": "A Clifton institution and one of Bristol's most celebrated cider pubs - famous for its 'Exhibition' cider, which is considerably stronger than it tastes. Approach with caution!",
    "audio": "audio/the-coronation-tap.mp4"
  },
  {
    "id": "the-rummer",
    "name": "The Rummer",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˈrʌm.ə",
    "teachingNote": "Say thə RU-mə - the vowel in 'Rummer' is the same as in 'cup'. The final 'er' is a schwa.",
    "extraNote": "One of Bristol's oldest pubs, on a site licensed since 1241 in the heart of the Old City - a characterful historic pub well worth seeking out.",
    "audio": "audio/the-rummer.mp4"
  },
  {
    "id": "the-mall",
    "name": "The Mall",
    "category": "Landmarks & Destinations",
    "ipa": "ðə ˈmɔːl",
    "teachingNote": "The pub is pronounced: thə MAWL - the long /ɔː/ is the same as the vowel in 'ball' or 'call'. Some people say thə MAL, with an open /æ/ like in 'cat'.",
    "extraNote": "A classic Clifton pub on The Mall in Clifton Village - a great spot for a pint or some food after visiting the Suspension Bridge or exploring Clifton's shops and restaurants.",
    "audio": "audio/the-mall.mp4"
  }
];
