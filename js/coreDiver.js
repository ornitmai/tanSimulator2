/* ===== coreDiver.js — "צוללן הליבה" Roguelike Game ===== */

const CoreDiver = (() => {
  let initialized = false;
  let visible = false;
  let audioCtx = null;

  // ─── DATA ───────────────────────────────────────────────
  const ZONES = [
    { id:'crust', name:'קרום', nameEn:'Crust', depth:[0,35], rooms:3, bg:'#1a1008', accent:'#d4a054', glow:'rgba(212,160,84,0.15)' },
    { id:'mantle', name:'מעטפת', nameEn:'Mantle', depth:[35,2900], rooms:3, bg:'#1a0808', accent:'#ff6b35', glow:'rgba(255,107,53,0.15)' },
    { id:'outer_core', name:'ליבה חיצונית', nameEn:'Outer Core', depth:[2900,5100], rooms:3, bg:'#1a1400', accent:'#ffd700', glow:'rgba(255,215,0,0.15)' },
    { id:'inner_core', name:'ליבה פנימית', nameEn:'Inner Core', depth:[5100,6371], rooms:2, bg:'#0a0a14', accent:'#00ffff', glow:'rgba(0,255,255,0.15)' }
  ];

  const EVENTS = {
    crust: [
      { title:"כיס מגנטי עתיק", icon:"🪨", description:"סריקה מזהה שכבת סלע עם חתימה מגנטית מלפני 780,000 שנה — ההיפוך האחרון! הדגימה יכולה ללמד אותנו על מהירות ההיפוך.", choices:[
        { text:"לחקור את הדגימה", icon:"🔬", effects:{samples:3,energy:-15}, effectText:"+3 דגימות, -15 אנרגיה" },
        { text:"לתעד מרחוק ולהמשיך", icon:"📸", effects:{samples:1}, effectText:"+1 דגימה" }
      ]},
      { title:"תחנת מחקר נטושה", icon:"🏚️", description:"תחנה תת-קרקעית ממשלח קודם. החשמל עדיין עובד, אבל שמיעת רעשים מוזרים מלמטה.", choices:[
        { text:"לטעון אנרגיה", icon:"🔋", effects:{energy:30}, effectText:"+30 אנרגיה" },
        { text:"לתקן מגנים", icon:"🛡️", effects:{shields:20,energy:-10}, effectText:"+20 מגנים, -10 אנרגיה" },
        { text:"לחפש במאגר הנתונים", icon:"🗄️", effects:{samples:2,heat:5}, effectText:"+2 דגימות, +5 חום" }
      ]},
      { title:"רעידה טקטונית", icon:"💥", description:"הקרקע רועדת. סדקים נפתחים סביב הפרוב. מעבר ישיר נחשף אבל הוא לא יציב.", choices:[
        { text:"קיצור דרך בסדק!", icon:"🏃", effects:{heat:15,shields:-15,skipRoom:true}, effectText:"דילוג חדר! +15 חום, -15 מגנים" },
        { text:"מסלול בטוח", icon:"🐢", effects:{}, effectText:"ללא שינוי" }
      ]}
    ],
    mantle: [
      { title:"מערבולת מגמה", icon:"🌀", description:"זרם מגמטי אדיר חוסם את המעבר. הטמפרטורה כאן מגיעה ל-2,000 מעלות. המערבולת יכולה למחוץ את הפרוב.", choices:[
        { text:"לעבור בכוח", icon:"💨", effects:{shields:-25,heat:5}, effectText:"-25 מגנים, +5 חום" },
        { text:"לחכות שתירגע", icon:"⏳", effects:{energy:-20}, effectText:"-20 אנרגיה" },
        { text:"מגנט דחייה", icon:"🧲", effects:{energy:-15,shields:-10}, effectText:"-15 אנרגיה, -10 מגנים" }
      ]},
      { title:"שרידי פרוב 'חלוץ-7'", icon:"🛸", description:"הפרוב 'חלוץ-7' שנשלח לפניכם. הצוות שלו לא חזר. החיישנים שלו עדיין פעילים ושולחים אות חלש.", choices:[
        { text:"לפרק חלקי חילוף", icon:"🔧", effects:{shields:20}, effectText:"+20 מגנים" },
        { text:"להוריד את הנתונים", icon:"📊", effects:{energy:15,samples:1}, effectText:"+15 אנרגיה, +1 דגימה" },
        { text:"לסמן מיקום ולהמשיך", icon:"📍", effects:{samples:2}, effectText:"+2 דגימות (מורל)" }
      ]},
      { title:"בועת גז לחוצה", icon:"💎", description:"בועת גז ענקית תחת לחץ עצום. אם תתפוצץ — הנזק יהיה אדיר. אבל בפנים יש מינרלים נדירים.", choices:[
        { text:"לנקוב בזהירות", icon:"🎯", effects:{samples:4,shields:-10}, effectText:"+4 דגימות, -10 מגנים (סיכון)" },
        { text:"לעקוף", icon:"↩️", effects:{heat:5}, effectText:"+5 חום (סיבוב ארוך)" }
      ]}
    ],
    outer_core: [
      { title:"גביש ברזל-ניקל ענק", icon:"💠", description:"גביש מתכתי בגודל בניין. השדה המגנטי סביבו מעוות את כל החיישנים. בפנים — מידע קריטי על מבנה הליבה.", choices:[
        { text:"לחצוב דגימת ליבה", icon:"⛏️", effects:{samples:5,heat:10}, effectText:"+5 דגימות, +10 חום" },
        { text:"לסרוק מרחוק", icon:"📡", effects:{samples:1}, effectText:"+1 דגימה" }
      ]},
      { title:"סערה מגנטית מקומית", icon:"⚡", description:"הפרוב נכנס לאזור של תנודות מגנטיות פראיות. החיישנים משתגעים, מערכת הניווט מאבדת כיוון.", choices:[
        { text:"להתקדם בעיוורון", icon:"🎲", effects:{shields:-20,heat:5}, effectText:"-20 מגנים, +5 חום (מסוכן!)" },
        { text:"לעגן ולחכות שתחלוף", icon:"⚓", effects:{energy:-25}, effectText:"-25 אנרגיה" },
        { text:"להשתמש במגנט כמצפן", icon:"🧭", effects:{energy:-15,shields:-5}, effectText:"-15 אנרגיה, -5 מגנים" }
      ]},
      { title:"זרם ברזל מהיר", icon:"🌊", description:"נתקלתם בזרם ברזל נוזלי ב-4,500 מעלות שזורם במהירות עצומה. הוא חלק מה'נהר' שמניע את הדינמו.", choices:[
        { text:"לגלוש עם הזרם!", icon:"🏄", effects:{heat:15,skipRoom:true,energy:-10}, effectText:"דילוג חדר! +15 חום, -10 אנרגיה" },
        { text:"לחצות בזהירות", icon:"🚶", effects:{shields:-15}, effectText:"-15 מגנים" }
      ]}
    ],
    inner_core: [
      { title:"גבול הליבה הפנימית", icon:"🔥", description:"360 גיגה-פסקל. 5,000 מעלות. הברזל כאן מוצק למרות החום — הלחץ מנצח. הפרוב ברגע האמת.", choices:[
        { text:"ספרינט אחרון!", icon:"🚀", effects:{energy:-30,heat:15}, effectText:"-30 אנרגיה, +15 חום" },
        { text:"צלילה הדרגתית", icon:"🐌", effects:{shields:-15,heat:10}, effectText:"-15 מגנים, +10 חום" }
      ]},
      { title:"הד של חלוץ-7", icon:"👻", description:"הנתונים שהורדתם מחלוץ-7 כוללים הודעה אחרונה: 'הדינמו לא שבור — הוא ישן. תעירו אותו בעדינות.'", choices:[
        { text:"לשנות אסטרטגיה — גישה עדינה", icon:"🕊️", effects:{energy:20,shields:10}, effectText:"+20 אנרגיה, +10 מגנים" },
        { text:"להמשיך לפי התוכנית", icon:"📋", effects:{samples:3}, effectText:"+3 דגימות" }
      ]}
    ]
  };

  const QUESTIONS = {
    crust: [
      { question:"מהי יחידת המדידה של עוצמת שדה מגנטי?", answers:[{text:"ניוטון",correct:false},{text:"טסלה",correct:true},{text:"וולט",correct:false}], explanation:"עוצמת שדה מגנטי נמדדת בטסלה (T). שדה כדור הארץ הוא כ-25-65 מיקרוטסלה.", reward:{type:"energy",amount:10}, topic:"יחידות מדידה" },
      { question:"מה גורם למצפן להצביע צפונה?", answers:[{text:"כוח הכבידה",correct:false},{text:"השדה המגנטי של כדור הארץ",correct:true},{text:"סיבוב כדור הארץ",correct:false}], explanation:"המחט המגנטית של המצפן מתיישרת עם קווי השדה המגנטי של כדור הארץ ומצביעה לכיוון הקוטב המגנטי הצפוני.", reward:{type:"energy",amount:10}, topic:"מגנטיזם" },
      { question:"מה עובי הקרום האוקייני בממוצע?", answers:[{text:"5-10 ק\"מ",correct:true},{text:"30-50 ק\"מ",correct:false},{text:"100 ק\"מ",correct:false}], explanation:"הקרום האוקייני דק יחסית — 5-10 ק\"מ בלבד. הקרום היבשתי עבה הרבה יותר: 30-50 ק\"מ.", reward:{type:"shields",amount:5}, topic:"מבנה כדור הארץ" },
      { question:"מה הנוסחה לשדה המגנטי במרכז לולאת זרם?", answers:[{text:"B = μ₀NI / 2R",correct:true},{text:"B = μ₀I / 2πR",correct:false},{text:"B = NI / R²",correct:false}], explanation:"השדה במרכז סליל עם N ליפופים ורדיוס R הוא B = μ₀NI/2R. זו הנוסחה שבבסיס הגלוונומטר הטנגנטי!", reward:{type:"energy",amount:15}, topic:"אלקטרומגנטיות" },
      { question:"בגלוונומטר טנגנטי, מה tan(θ) שווה?", answers:[{text:"B_loop / B_H",correct:true},{text:"B_H / B_loop",correct:false},{text:"B_loop × B_H",correct:false}], explanation:"הטנגנס של זווית הסטייה שווה ליחס בין השדה מהלולאה לשדה כדור הארץ: tan(θ) = B_loop / B_H", reward:{type:"samples",amount:1}, topic:"גלוונומטר טנגנטי" },
      { question:"מהו μ₀ (מיו אפס)?", answers:[{text:"קבוע החדירות המגנטית של הריק",correct:true},{text:"מטען האלקטרון",correct:false},{text:"מהירות האור",correct:false}], explanation:"μ₀ = 4π×10⁻⁷ T·m/A — זהו קבוע החדירות המגנטית של הריק, ומופיע בכל נוסחאות המגנטיזם.", reward:{type:"energy",amount:10}, topic:"קבועים פיזיקליים" },
      { question:"כמה שכבות עיקריות יש לכדור הארץ?", answers:[{text:"3",correct:false},{text:"4",correct:true},{text:"6",correct:false}], explanation:"ארבע שכבות: קרום, מעטפת, ליבה חיצונית (נוזלית) וליבה פנימית (מוצקה).", reward:{type:"shields",amount:5}, topic:"מבנה כדור הארץ" },
      { question:"איזה סוג סלע נמצא ברוב הקרום האוקייני?", answers:[{text:"גרניט",correct:false},{text:"בזלת",correct:true},{text:"שיש",correct:false}], explanation:"הקרום האוקייני מורכב בעיקר מבזלת — סלע געשי כהה וצפוף. הקרום היבשתי מורכב בעיקר מגרניט.", reward:{type:"energy",amount:10}, topic:"גאולוגיה" },
      { question:"מה עוצמת השדה המגנטי של כדור הארץ בישראל?", answers:[{text:"כ-25 מיקרוטסלה",correct:false},{text:"כ-44 מיקרוטסלה",correct:true},{text:"כ-100 מיקרוטסלה",correct:false}], explanation:"בישראל השדה הוא כ-44 μT (הרכיב האופקי כ-25 μT). זה קרוב לממוצע העולמי.", reward:{type:"samples",amount:1}, topic:"שדה מגנטי" },
      { question:"מה קורה לזווית θ בגלוונומטר כשמגדילים את הזרם?", answers:[{text:"יורדת",correct:false},{text:"עולה (עד 90°)",correct:true},{text:"לא משתנה",correct:false}], explanation:"ככל שהזרם גדל, השדה מהלולאה גדל, הזווית עולה. כש-θ מתקרב ל-90° הגרף מאבד משמעות כי tan(θ)→∞.", reward:{type:"energy",amount:10}, topic:"גלוונומטר טנגנטי" }
    ],
    mantle: [
      { question:"מה מניע את תנועת הלוחות הטקטוניים?", answers:[{text:"רוח",correct:false},{text:"זרמי הסעה במעטפת",correct:true},{text:"כוח הכבידה של הירח",correct:false}], explanation:"זרמי הסעה (Convection Currents) במעטפת — חומר חם עולה, מתקרר ויורד — מניעים את הלוחות.", reward:{type:"shields",amount:10}, topic:"טקטוניקה" },
      { question:"באיזה מצב צבירה נמצאת המעטפת?", answers:[{text:"נוזלית",correct:false},{text:"מוצקה אך זורמת לאט",correct:true},{text:"גזית",correct:false}], explanation:"המעטפת מוצקה, אך בטמפרטורות ולחצים כל כך גבוהים היא זורמת לאט מאוד — כמו דבש סמיך מאוד.", reward:{type:"energy",amount:10}, topic:"מבנה כדור הארץ" },
      { question:"מה הטמפרטורה בגבול מעטפת-ליבה?", answers:[{text:"כ-500°C",correct:false},{text:"כ-1,000°C",correct:false},{text:"כ-3,500°C",correct:true}], explanation:"בגבול מעטפת-ליבה (עומק ~2,900 ק\"מ) הטמפרטורה מגיעה לכ-3,500°C — כמעט כמו פני השמש!", reward:{type:"shields",amount:10}, topic:"טמפרטורות" },
      { question:"מה הקשר בין מספר הליפופים N לעוצמת השדה?", answers:[{text:"קשר ישר — כפול ליפופים = כפול שדה",correct:true},{text:"קשר הפוך",correct:false},{text:"אין קשר",correct:false}], explanation:"B = μ₀NI/2R — השדה פרופורציוני ישירות ל-N. הכפלת הליפופים מכפילה את השדה.", reward:{type:"energy",amount:15}, topic:"אלקטרומגנטיות" },
      { question:"מהי האסתנוספרה?", answers:[{text:"החלק העליון של הליבה",correct:false},{text:"שכבה חלשה מכנית במעטפת העליונה",correct:true},{text:"האטמוספרה של כדור הארץ",correct:false}], explanation:"האסתנוספרה היא שכבה 'רכה' יחסית במעטפת העליונה (100-200 ק\"מ), שעליה צפים ונעים הלוחות הטקטוניים.", reward:{type:"samples",amount:1}, topic:"מבנה כדור הארץ" },
      { question:"מהו 'פליאומגנטיזם'?", answers:[{text:"מגנטיות של כוכבים",correct:false},{text:"חקר שדות מגנטיים קדומים משמורים בסלעים",correct:true},{text:"סוג של מגנט",correct:false}], explanation:"כשלבה מתקררת, מינרלים מגנטיים 'קופאים' בכיוון השדה באותו רגע. כך נוצר 'סרט הקלטה' גאולוגי.", reward:{type:"energy",amount:10}, topic:"פליאומגנטיזם" },
      { question:"למה הגלוונומטר הטנגנטי צריך להיות מיושר עם המרידיאן המגנטי?", answers:[{text:"כדי שהמחט תתחיל ב-0°",correct:true},{text:"כדי שהזרם יזרום",correct:false},{text:"כדי למנוע קצר",correct:false}], explanation:"כשהלולאה מיושרת עם מישור המרידיאן המגנטי, השדה שלה מאונך לשדה כדור הארץ, ואז tan(θ) = B_loop/B_H.", reward:{type:"samples",amount:2}, topic:"גלוונומטר טנגנטי" },
      { question:"כמה זמן לוקח להיפוך קטבים מגנטי?", answers:[{text:"שניות",correct:false},{text:"אלפי שנים",correct:true},{text:"מיליוני שנים",correct:false}], explanation:"היפוך קטבים לוקח אלפי שנים. לפני ההיפוך יש 'החלשות' הדרגתית.", reward:{type:"shields",amount:10}, topic:"היפוך קטבים" },
      { question:"מה יקרה לשטף מגנטי דרך משטח אם נכפיל את השדה?", answers:[{text:"יוכפל",correct:true},{text:"ירד בחצי",correct:false},{text:"לא ישתנה",correct:false}], explanation:"שטף מגנטי Φ = B·A·cos(θ). אם B מוכפל (A ו-θ קבועים), השטף מוכפל — קשר ישר.", reward:{type:"energy",amount:10}, topic:"שטף מגנטי" },
      { question:"מהי הטמפרטורה בה חומר מאבד את תכונותיו המגנטיות?", answers:[{text:"טמפרטורת קיורי",correct:true},{text:"טמפרטורת רתיחה",correct:false},{text:"אפס מוחלט",correct:false}], explanation:"מעל טמפרטורת קיורי (~770°C לברזל) חומר פרומגנטי מאבד את מגנטיותו הקבועה.", reward:{type:"samples",amount:2}, topic:"מגנטיזם" }
    ],
    outer_core: [
      { question:"ממה מורכבת הליבה החיצונית?", answers:[{text:"סיליקון וחמצן",correct:false},{text:"ברזל וניקל נוזליים",correct:true},{text:"מגמה",correct:false}], explanation:"הליבה החיצונית היא ברזל וניקל נוזליים בטמפרטורה של 4,000-5,000°C. התנועה שלהם יוצרת את השדה המגנטי!", reward:{type:"shields",amount:15}, topic:"ליבת כדור הארץ" },
      { question:"מהי תיאוריית הדינמו?", answers:[{text:"תנועת ברזל נוזלי בליבה מייצרת שדה מגנטי",correct:true},{text:"מגנטים בליבה מסתובבים",correct:false},{text:"הקרום מייצר חשמל",correct:false}], explanation:"זרמי ברזל נוזלי בליבה החיצונית, מונעים על ידי חום ובסיבוב (כוח קוריוליס), יוצרים זרמים חשמליים שמייצרים את השדה המגנטי.", reward:{type:"energy",amount:15}, topic:"דינמו" },
      { question:"מה תפקיד כוח קוריוליס בדינמו?", answers:[{text:"הוא מייצר חום",correct:false},{text:"הוא מארגן את זרמי הברזל לדפוסים מסודרים",correct:true},{text:"הוא מאט את סיבוב כדור הארץ",correct:false}], explanation:"כוח קוריוליס (מסיבוב כדור הארץ) מארגן את זרמי הברזל הנוזלי לתנועה סלילית מסודרת — בלעדיו לא היה נוצר שדה דו-קוטבי.", reward:{type:"shields",amount:15}, topic:"דינמו" },
      { question:"מה ההבדל בין הליבה החיצונית לפנימית?", answers:[{text:"החיצונית נוזלית, הפנימית מוצקה",correct:true},{text:"החיצונית חמה יותר",correct:false},{text:"אין הבדל",correct:false}], explanation:"הליבה החיצונית נוזלית (4,000-5,000°C) והפנימית מוצקה (5,000-6,000°C) למרות שהיא חמה יותר — בגלל הלחץ האדיר!", reward:{type:"samples",amount:2}, topic:"ליבת כדור הארץ" },
      { question:"מה היה קורה אם השדה המגנטי של כדור הארץ ייעלם?", answers:[{text:"שום דבר",correct:false},{text:"הרוח הסולארית תפגע באטמוספרה",correct:true},{text:"כדור הארץ יפסיק להסתובב",correct:false}], explanation:"בלי שדה מגנטי, הרוח הסולארית תפגע ישירות באטמוספרה ותשחוק אותה לאט — בדיוק מה שקרה למאדים!", reward:{type:"energy",amount:15}, topic:"מגנטוספרה" },
      { question:"מהו אפקט הזורה הקוטבית (Aurora)?", answers:[{text:"התנגשות חלקיקים סולאריים עם האטמוספרה",correct:true},{text:"החזרת אור שמש מקרחונים",correct:false},{text:"ברקים בשכבת הסטרטוספרה",correct:false}], explanation:"חלקיקים טעונים מהשמש נתפסים בשדה המגנטי ומנותבים לקטבים, שם הם מתנגשים עם מולקולות אטמוספרה ויוצרים את הזוהר.", reward:{type:"samples",amount:2}, topic:"מגנטוספרה" },
      { question:"מהו גבול גוטנברג?", answers:[{text:"הגבול בין הקרום למעטפת",correct:false},{text:"הגבול בין המעטפת לליבה החיצונית",correct:true},{text:"הגבול בין שתי הליבות",correct:false}], explanation:"גבול גוטנברג (עומק ~2,900 ק\"מ) הוא המעבר ממעטפת מוצקה לליבה נוזלית. גלי S נעצרים כאן!", reward:{type:"shields",amount:15}, topic:"סייסמולוגיה" },
      { question:"למה גלי S נעצרים בליבה החיצונית?", answers:[{text:"כי היא מגנטית מדי",correct:false},{text:"כי גלי S לא עוברים בנוזל",correct:true},{text:"כי הטמפרטורה גבוהה מדי",correct:false}], explanation:"גלי S (גלי גזירה) זקוקים למדיום מוצק. כשהם מגיעים לליבה החיצונית הנוזלית הם נעלמים.", reward:{type:"energy",amount:15}, topic:"סייסמולוגיה" },
      { question:"מה עוצמת השדה המגנטי של מאדים?", answers:[{text:"כמו כדור הארץ",correct:false},{text:"כ-0.5 מיקרוטסלה (שרידי קרום)",correct:true},{text:"אין בכלל",correct:false}], explanation:"למאדים אין שדה מגנטי גלובלי פעיל — רק שרידים מגנטיים בסלעי הקרום (~0.5 μT).", reward:{type:"samples",amount:3}, topic:"מגנטיזם פלנטרי" },
      { question:"איך שדה מגנטי שולט על חלקיק טעון?", answers:[{text:"דוחף אותו קדימה",correct:false},{text:"מפעיל כוח מאונך לכיוון התנועה (כוח לורנץ)",correct:true},{text:"עוצר אותו",correct:false}], explanation:"כוח לורנץ: F = qv×B. הכוח תמיד מאונך לתנועה, כך שהחלקיק נע במסלול מעגלי או סלילי.", reward:{type:"shields",amount:15}, topic:"כוח לורנץ" }
    ],
    inner_core: [
      { question:"למה הליבה הפנימית מוצקה למרות טמפרטורה של 5,000°C+?", answers:[{text:"בגלל הלחץ האדיר (360 GPa)",correct:true},{text:"בגלל שהיא מגנטית",correct:false},{text:"בגלל שהיא קטנה",correct:false}], explanation:"בלחץ של 360 גיגה-פסקל (3.6 מיליון אטמוספרות!) אפילו ברזל ב-5,000°C נשאר מוצק.", reward:{type:"shields",amount:20}, topic:"פיזיקה קיצונית" },
      { question:"מתי התרחש ההיפוך המגנטי האחרון?", answers:[{text:"לפני 780,000 שנה (Brunhes-Matuyama)",correct:true},{text:"לפני 100 שנה",correct:false},{text:"לפני 10 מיליון שנה",correct:false}], explanation:"ההיפוך האחרון — Brunhes-Matuyama — היה לפני 780,000 שנה. בממוצע יש היפוך כל 200,000-300,000 שנה.", reward:{type:"energy",amount:20}, topic:"היפוך קטבים" },
      { question:"מה הלחץ במרכז כדור הארץ?", answers:[{text:"כ-100 אטמוספרות",correct:false},{text:"כ-1 מיליון אטמוספרות",correct:false},{text:"כ-3.6 מיליון אטמוספרות",correct:true}], explanation:"הלחץ במרכז כדור הארץ הוא כ-360 GPa — 3.6 מיליון אטמוספרות!", reward:{type:"samples",amount:3}, topic:"פיזיקה קיצונית" },
      { question:"כיצד חוקרים מגלים היפוכי קטבים מהעבר?", answers:[{text:"קוראים מסמכים עתיקים",correct:false},{text:"חוקרים מינרלים מגנטיים בסלעים געשיים שהתקררו",correct:true},{text:"מודדים את השמש",correct:false}], explanation:"כשלבה מתקררת, מינרלים מגנטיים 'קופאים' בכיוון השדה שהיה. בקרקעית האוקיינוס יש 'פסים' מגנטיים סימטריים.", reward:{type:"energy",amount:20}, topic:"פליאומגנטיזם" },
      { question:"האם גידול הליבה הפנימית עוזר לשדה המגנטי?", answers:[{text:"כן — שחרור חום קרישה מניע את הדינמו",correct:true},{text:"לא — הליבה לא קשורה לשדה",correct:false},{text:"ההיפך — מזיק לשדה",correct:false}], explanation:"כשברזל נוזלי בליבה החיצונית קורש ומצטרף לליבה הפנימית, הוא משחרר חום שמניע את זרמי ההסעה.", reward:{type:"shields",amount:20}, topic:"דינמו" },
      { question:"מה ממד הליבה הפנימית?", answers:[{text:"כגודל הירח",correct:true},{text:"כגודל כדור טניס",correct:false},{text:"חצי מכדור הארץ",correct:false}], explanation:"רדיוס הליבה הפנימית כ-1,220 ק\"מ — קרוב מאוד לגודל הירח (1,737 ק\"מ).", reward:{type:"samples",amount:3}, topic:"ליבת כדור הארץ" },
      { question:"מה היה קורה לכדור הארץ אם הדינמו היה כבה?", answers:[{text:"היינו הופכים למאדים — אטמוספרה מופשטת, קרינה ישירה",correct:true},{text:"שום דבר מיוחד",correct:false},{text:"כדור הארץ היה מתפוצץ",correct:false}], explanation:"בדיוק כמו מאדים — בלי שדה מגנטי, הרוח הסולארית תשחוק את האטמוספרה.", reward:{type:"shields",amount:25}, topic:"מגנטוספרה" },
      { question:"מהי 'אנומליית דרום אטלנטיק' (SAA)?", answers:[{text:"אזור בו השדה המגנטי חלש במיוחד",correct:true},{text:"מערבולת באוקיינוס",correct:false},{text:"הר געש תת-ימי",correct:false}], explanation:"ה-SAA הוא אזור מעל ברזיל-אטלנטיק בו השדה חלש ב-30%+. לוויינים מדווחים על יותר תקלות שם.", reward:{type:"samples",amount:4}, topic:"שדה מגנטי" }
    ]
  };

  const UPGRADES = [
    { id:"extra_shields", name:"שכבת מגן נוספת", icon:"🛡️", cost:3, desc:"+30 מגנים מקסימום" },
    { id:"cooling", name:"קירור משופר", icon:"❄️", cost:3, desc:"-2 חום בכל חדר" },
    { id:"big_battery", name:"סוללה גדולה", icon:"🔋", cost:3, desc:"+20 אנרגיה מקסימום" },
    { id:"sensor", name:"חיישן מגנטי", icon:"📡", cost:2, desc:"רואים סוגי חדרים מראש" },
    { id:"heat_shield", name:"מגן חום", icon:"🔥", cost:4, desc:"חום עולה לאט יותר (×0.7)" },
    { id:"repulsor", name:"מגנט דחייה", icon:"🧲", cost:4, desc:"-5 נזק בבוסים" },
    { id:"epistemic", name:"מאיץ ידע", icon:"💡", cost:3, desc:"בונוס ×1.5 על שאלות נכונות" }
  ];

  const BOSSES = [
    { name:"הסדק הגדול", depth:35, type:"alignment", size:5, timer:30, penalty:10, zone:'crust' },
    { name:"זרם המגמה", depth:2900, type:"navigation", size:8, hotMove:2, penalty:15, zone:'mantle' },
    { name:"הסערה המגנטית", depth:5100, type:"polarity", length:12, noise:true, penalty:20, zone:'outer_core' },
    { name:"הדינמו השבור", depth:6371, type:"multi", phases:[
      { type:"alignment", size:4, timer:20 },
      { type:"navigation", size:6, steps:15 },
      { type:"polarity", length:8, fast:true }
    ], zone:'inner_core' }
  ];

  // ─── GAME STATE ────────────────────────────────────────
  let gameState = null;
  let logMessages = [];
  let askedQuestions = new Set();
  let pendingQuestion = null;
  let puzzleState = null;
  let timerInterval = null;

  function newGameState() {
    return {
      screen: 'briefing',
      shields: 100, maxShields: 100,
      energy: 80, maxEnergy: 80,
      heat: 0, maxHeat: 100,
      samples: 0,
      upgrades: [],
      depth: 0,
      questionsCorrect: 0, questionsTotal: 0,
      roomsCleared: 0,
      zoneIndex: 0,
      currentRow: 0,
      map: null,
      bossPhase: 0,
      topicStats: {},
      skipNextRoom: false
    };
  }

  // ─── AUDIO ────────────────────────────────────────────
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playTone(freq, duration, type, vol) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = vol || 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }

  function sfxCorrect() { playTone(440, 0.1, 'sine'); setTimeout(() => playTone(660, 0.15, 'sine'), 100); }
  function sfxWrong() { playTone(330, 0.1, 'sawtooth'); setTimeout(() => playTone(220, 0.2, 'sawtooth'), 100); }
  function sfxClick() { playTone(800, 0.05, 'sine', 0.1); }
  function sfxDamage() { playTone(80, 0.3, 'sawtooth', 0.2); }
  function sfxZone() { playTone(260, 0.2, 'sine'); setTimeout(() => playTone(330, 0.2, 'sine'), 150); setTimeout(() => playTone(390, 0.3, 'sine'), 300); }

  // ─── UTILITIES ────────────────────────────────────────
  function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function addLog(msg) {
    logMessages.push({ text: msg, time: Date.now() });
    if (logMessages.length > 50) logMessages.shift();
  }

  function currentZone() { return ZONES[gameState.zoneIndex]; }
  function currentZoneId() { return currentZone().id; }

  function hasUpgrade(id) { return gameState.upgrades.includes(id); }

  function getHeatIncrease(amount) {
    let h = amount;
    if (hasUpgrade('cooling')) h -= 2;
    if (hasUpgrade('heat_shield')) h = Math.round(h * 0.7);
    return Math.max(0, h);
  }

  function applyEffects(effects) {
    if (!effects) return;
    if (effects.shields) gameState.shields = clamp(gameState.shields + effects.shields, 0, gameState.maxShields);
    if (effects.energy) gameState.energy = clamp(gameState.energy + effects.energy, 0, gameState.maxEnergy);
    if (effects.heat) {
      const h = effects.heat > 0 ? getHeatIncrease(effects.heat) : effects.heat;
      gameState.heat = clamp(gameState.heat + h, 0, gameState.maxHeat);
    }
    if (effects.samples) gameState.samples = Math.max(0, gameState.samples + effects.samples);
    if (effects.skipRoom) gameState.skipNextRoom = true;
  }

  function checkGameOver() {
    if (gameState.shields <= 0) { gameState.screen = 'gameover'; gameState.gameOverReason = 'shields'; addLog('מגנים הושמדו! המשימה נכשלה.'); render(); return true; }
    if (gameState.heat >= gameState.maxHeat) { gameState.screen = 'gameover'; gameState.gameOverReason = 'heat'; addLog('התחממות קריטית! המשימה נכשלה.'); render(); return true; }
    return false;
  }

  function calcDepth() {
    const z = currentZone();
    const totalRows = z.rooms + 1;
    const row = Math.min(gameState.currentRow, totalRows);
    const frac = row / totalRows;
    gameState.depth = Math.round(z.depth[0] + (z.depth[1] - z.depth[0]) * frac);
  }

  // ─── MAP GENERATION ───────────────────────────────────
  function generateMap(zoneIndex) {
    const z = ZONES[zoneIndex];
    const numRows = z.rooms;
    const rows = [];
    const nodeTypes = ['puzzle','puzzle','puzzle','puzzle','event','event','event','repair','repair','treasure','treasure'];
    let hasRepair = false;

    for (let r = 0; r < numRows; r++) {
      const numNodes = rng(2, 3);
      const row = [];
      for (let n = 0; n < numNodes; n++) {
        let t = pick(nodeTypes);
        if (t === 'repair') hasRepair = true;
        row.push({ type: t, id: `${r}-${n}`, cleared: false, connections: [] });
      }
      rows.push(row);
    }
    // Ensure at least 1 repair
    if (!hasRepair && numRows > 0) {
      const rr = rng(0, numRows - 1);
      const rn = rng(0, rows[rr].length - 1);
      rows[rr][rn].type = 'repair';
    }
    // Boss row
    rows.push([{ type: 'boss', id: `${numRows}-0`, cleared: false, connections: [] }]);
    // Connect rows
    for (let r = 0; r < rows.length - 1; r++) {
      for (let n = 0; n < rows[r].length; n++) {
        const nextRow = rows[r + 1];
        // Connect to at least 1 node in next row
        const c1 = Math.min(n, nextRow.length - 1);
        rows[r][n].connections.push(c1);
        // Maybe connect to another
        if (nextRow.length > 1 && Math.random() > 0.4) {
          const c2 = c1 === 0 ? 1 : c1 - 1;
          if (!rows[r][n].connections.includes(c2)) rows[r][n].connections.push(c2);
        }
      }
    }
    return rows;
  }

  function nodeIcon(type, hasSensor) {
    if (!hasSensor && type !== 'boss') return '❓';
    switch(type) {
      case 'puzzle': return '⚡';
      case 'event': return '📡';
      case 'repair': return '🔧';
      case 'treasure': return '🧲';
      case 'boss': return '💀';
      default: return '❓';
    }
  }

  function nodeLabel(type, hasSensor) {
    if (!hasSensor && type !== 'boss') return 'לא ידוע';
    switch(type) {
      case 'puzzle': return 'פאזל';
      case 'event': return 'אירוע';
      case 'repair': return 'תיקון';
      case 'treasure': return 'אוצר';
      case 'boss': return 'בוס';
      default: return 'לא ידוע';
    }
  }

  // ─── QUESTION SYSTEM ──────────────────────────────────
  function getQuestion() {
    const zId = currentZoneId();
    const pool = QUESTIONS[zId].filter((q, i) => !askedQuestions.has(zId + i));
    if (pool.length === 0) { askedQuestions.clear(); return getQuestion(); }
    const idx = Math.floor(Math.random() * pool.length);
    const q = pool[idx];
    const realIdx = QUESTIONS[zId].indexOf(q);
    askedQuestions.add(zId + realIdx);
    return q;
  }

  function setPendingQuestion() {
    pendingQuestion = getQuestion();
  }

  // ─── CSS INJECTION ────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cd-styles')) return;
    const style = document.createElement('style');
    style.id = 'cd-styles';
    style.textContent = `
      .core-diver {
        --cd-bg: #0a0a12;
        --cd-accent: #d4a054;
        --cd-glow: rgba(212,160,84,0.15);
        --cd-shields: #00e5ff;
        --cd-energy: #ffa502;
        --cd-heat: #ff4757;
        --cd-samples: #ffd700;
        --cd-success: #2ed573;
        --cd-danger: #ff4757;
        font-family: 'Heebo', 'Assistant', sans-serif;
        background: var(--cd-bg);
        color: #c8c8d0;
        direction: rtl;
        position: relative;
        min-height: 80vh;
        overflow: hidden;
        border-radius: 12px;
        transition: --cd-bg 0.8s, --cd-accent 0.8s;
      }
      .core-diver * { box-sizing: border-box; }
      .core-diver::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
        pointer-events: none;
        z-index: 10;
      }
      .core-diver::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%);
        pointer-events: none;
        z-index: 10;
      }
      @keyframes cd-flicker {
        0%,100% { opacity:1; }
        50% { opacity:0.97; }
      }
      .core-diver { animation: cd-flicker 8s infinite; }
      .cd-layout {
        display: grid;
        grid-template-columns: 180px 1fr 200px;
        grid-template-rows: auto 1fr auto;
        grid-template-areas:
          "header header header"
          "sidebar main epistemic"
          "bottom bottom bottom";
        min-height: 80vh;
        position: relative;
        z-index: 5;
      }
      @media (max-width: 768px) {
        .cd-layout {
          grid-template-columns: 50px 1fr;
          grid-template-areas:
            "header header"
            "sidebar main"
            "bottom bottom";
        }
        .cd-epistemic-panel { display: none !important; }
        .cd-epistemic-modal { display: block !important; }
        .cd-sidebar .cd-stat-label { display: none; }
      }
      .cd-header {
        grid-area: header;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: rgba(0,0,0,0.5);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        font-family: 'Orbitron', monospace;
      }
      .cd-header h1 { font-size: 16px; color: var(--cd-accent); text-shadow: 0 0 10px var(--cd-glow); margin: 0; }
      .cd-header .cd-zone-name { font-size: 13px; color: var(--cd-accent); opacity: 0.8; }
      .cd-header .cd-depth { font-size: 13px; color: #888; font-family: 'IBM Plex Mono', 'Courier New', monospace; }
      .cd-sidebar {
        grid-area: sidebar;
        padding: 12px 10px;
        background: rgba(0,0,0,0.3);
        border-left: 1px solid rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-family: 'IBM Plex Mono', 'Courier New', monospace;
        font-size: 12px;
      }
      .cd-stat { display: flex; align-items: center; gap: 6px; }
      .cd-stat-icon { font-size: 16px; width: 22px; text-align: center; }
      .cd-stat-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
      .cd-stat-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
      .cd-stat-val { font-size: 11px; min-width: 35px; text-align: left; font-family: 'Orbitron', monospace; }
      .cd-main {
        grid-area: main;
        padding: 16px;
        overflow-y: auto;
        max-height: 70vh;
      }
      .cd-epistemic-panel {
        grid-area: epistemic;
        padding: 12px 10px;
        background: rgba(0,0,0,0.3);
        border-right: 1px solid rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
      }
      .cd-epistemic-modal { display: none; }
      .cd-bottom {
        grid-area: bottom;
        padding: 6px 16px;
        background: rgba(0,0,0,0.5);
        border-top: 1px solid rgba(255,255,255,0.05);
        font-family: 'IBM Plex Mono', 'Courier New', monospace;
        font-size: 11px;
        color: #666;
        max-height: 60px;
        overflow-y: auto;
        direction: rtl;
      }
      .cd-bottom div { padding: 1px 0; }
      .cd-btn {
        padding: 8px 16px;
        border: 1px solid var(--cd-accent);
        background: rgba(0,0,0,0.4);
        color: var(--cd-accent);
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Heebo', sans-serif;
        font-size: 14px;
        text-shadow: 0 0 6px var(--cd-glow);
        transition: all 0.2s;
        text-align: center;
      }
      .cd-btn:hover { background: var(--cd-accent); color: #000; }
      .cd-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .cd-btn-sm { padding: 5px 10px; font-size: 12px; }
      .cd-btn-danger { border-color: var(--cd-danger); color: var(--cd-danger); }
      .cd-btn-danger:hover { background: var(--cd-danger); color: #fff; }
      .cd-btn-success { border-color: var(--cd-success); color: var(--cd-success); }
      .cd-btn-success:hover { background: var(--cd-success); color: #000; }
      .cd-title { font-family: 'Orbitron', monospace; color: var(--cd-accent); text-shadow: 0 0 15px var(--cd-glow); margin-bottom: 12px; font-size: 20px; }
      .cd-subtitle { font-family: 'Orbitron', monospace; color: var(--cd-accent); font-size: 14px; margin-bottom: 8px; opacity: 0.8; }
      .cd-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 10px;
      }
      .cd-glow-text { text-shadow: 0 0 8px var(--cd-glow); }
      @keyframes cd-pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
      .cd-pulse { animation: cd-pulse 1.5s infinite; }
      @keyframes cd-shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }
      .cd-shake { animation: cd-shake 0.3s; }
      .cd-lamp { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; }
      .cd-lamp-active { box-shadow: 0 0 12px 4px var(--cd-accent); animation: cd-pulse 1.5s infinite; }
      .cd-map-node {
        width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-size: 20px; border: 2px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.5); cursor: default;
        transition: all 0.2s; position: relative;
      }
      .cd-map-node.active { border-color: var(--cd-accent); cursor: pointer; box-shadow: 0 0 12px var(--cd-glow); }
      .cd-map-node.active:hover { transform: scale(1.15); }
      .cd-map-node.cleared { opacity: 0.4; border-color: var(--cd-success); }
      .cd-map-node.current { border-color: #fff; box-shadow: 0 0 16px rgba(255,255,255,0.4); }
      .cd-grid-cell {
        width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
        border: 1px solid rgba(255,255,255,0.1); font-size: 18px; cursor: pointer;
        transition: all 0.15s; background: rgba(0,0,0,0.3);
      }
      .cd-grid-cell:hover { background: rgba(255,255,255,0.1); }
      .cd-nav-cell { width: 36px; height: 36px; font-size: 14px; border-radius: 3px; }
      .cd-nav-cell.wall { background: rgba(255,255,255,0.15); cursor: default; }
      .cd-nav-cell.hot { background: rgba(255,71,87,0.3); border-color: rgba(255,71,87,0.4); }
      .cd-nav-cell.player { background: var(--cd-accent); color: #000; font-weight: bold; }
      .cd-nav-cell.exit { background: rgba(46,213,115,0.3); border-color: var(--cd-success); }
      .cd-pol-block { width: 44px; height: 44px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin: 3px; }
      .cd-pol-n { background: rgba(0,229,255,0.3); border: 2px solid var(--cd-shields); color: var(--cd-shields); }
      .cd-pol-s { background: rgba(255,71,87,0.3); border: 2px solid var(--cd-danger); color: var(--cd-danger); }
      .cd-upgrade-card {
        display: flex; gap: 8px; align-items: center; padding: 8px; border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.3); margin-bottom: 6px;
        cursor: pointer; transition: all 0.2s;
      }
      .cd-upgrade-card:hover { border-color: var(--cd-accent); }
      .cd-upgrade-card.owned { border-color: var(--cd-success); opacity: 0.6; cursor: default; }
      .cd-briefing-bg {
        text-align: center; padding: 40px 20px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; min-height: 70vh;
      }
      .cd-fullscreen {
        position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column;
        align-items: center; justify-content: center; background: var(--cd-bg); padding: 30px;
        text-align: center;
      }
      .cd-noise { position: relative; }
      .cd-noise::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px);
        animation: cd-shake 0.15s infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── ZONE THEMING ─────────────────────────────────────
  function applyZoneTheme() {
    const el = document.querySelector('.core-diver');
    if (!el) return;
    const z = currentZone();
    el.style.setProperty('--cd-bg', z.bg);
    el.style.setProperty('--cd-accent', z.accent);
    el.style.setProperty('--cd-glow', z.glow);
  }

  // ─── RENDER HELPERS ───────────────────────────────────
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function statBar(icon, label, val, max, color) {
    const pct = Math.round((val / max) * 100);
    return `<div class="cd-stat">
      <span class="cd-stat-icon">${icon}</span>
      <span class="cd-stat-label" style="color:${color};min-width:45px;font-size:11px">${label}</span>
      <div class="cd-stat-bar"><div class="cd-stat-fill" style="width:${pct}%;background:${color}"></div></div>
      <span class="cd-stat-val" style="color:${color}">${val}</span>
    </div>`;
  }

  // ─── RENDER: SIDEBAR ──────────────────────────────────
  function renderSidebar() {
    const s = gameState;
    let html = '';
    html += statBar('🛡️', 'מגנים', s.shields, s.maxShields, 'var(--cd-shields)');
    html += statBar('⚡', 'אנרגיה', s.energy, s.maxEnergy, 'var(--cd-energy)');
    html += statBar('🌡️', 'חום', s.heat, s.maxHeat, 'var(--cd-heat)');
    html += `<div class="cd-stat"><span class="cd-stat-icon">💎</span><span class="cd-stat-label" style="color:var(--cd-samples);min-width:45px;font-size:11px">דגימות</span><span class="cd-stat-val" style="color:var(--cd-samples)">${s.samples}</span></div>`;
    if (s.upgrades.length > 0) {
      html += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px">';
      html += '<div style="font-size:10px;color:#666;margin-bottom:4px">שדרוגים:</div>';
      s.upgrades.forEach(uid => {
        const u = UPGRADES.find(x => x.id === uid);
        if (u) html += `<div style="font-size:11px" title="${u.desc}">${u.icon} ${u.name}</div>`;
      });
      html += '</div>';
    }
    return html;
  }

  // ─── RENDER: HEADER ───────────────────────────────────
  function renderHeader() {
    const z = currentZone();
    return `<h1>צוללן הליבה</h1>
      <span class="cd-zone-name">${z.name} | ${z.nameEn}</span>
      <span class="cd-depth">${gameState.depth} km ▼</span>
      <button class="cd-btn cd-btn-sm" style="font-size:10px;padding:4px 10px" onclick="CoreDiver._quitGame()">🚪 יציאה</button>`;
  }

  // ─── RENDER: BOTTOM LOG ───────────────────────────────
  function renderBottom() {
    return logMessages.slice(-5).map(m => `<div>> ${m.text}</div>`).join('');
  }

  // ─── RENDER: EPISTEMIC PANEL ──────────────────────────
  function renderEpistemicPanel() {
    if (!pendingQuestion) {
      return `<div style="text-align:center;padding:20px">
        <div class="cd-lamp" style="background:rgba(255,255,255,0.05);margin:0 auto 8px">💡</div>
        <div style="font-size:11px;color:#555">מנורת הידע</div>
        <div style="font-size:10px;color:#444;margin-top:4px">תשאל אחרי כל חדר</div>
      </div>`;
    }
    const q = pendingQuestion;
    let html = `<div style="text-align:center;margin-bottom:8px"><div class="cd-lamp cd-lamp-active" style="background:rgba(255,215,0,0.2)">💡</div></div>`;
    html += `<div style="font-size:12px;color:var(--cd-accent);margin-bottom:4px;font-family:'Orbitron',monospace">${q.topic}</div>`;
    html += `<div style="font-size:13px;margin-bottom:10px;line-height:1.5">${q.question}</div>`;
    q.answers.forEach((a, i) => {
      html += `<button class="cd-btn cd-btn-sm" style="width:100%;margin-bottom:5px;text-align:right" onclick="CoreDiver._answerQuestion(${i})">${a.text}</button>`;
    });
    return html;
  }

  function _answerQuestion(idx) {
    if (!pendingQuestion) return;
    const q = pendingQuestion;
    const correct = q.answers[idx].correct;
    gameState.questionsTotal++;
    if (!gameState.topicStats[q.topic]) gameState.topicStats[q.topic] = { correct: 0, total: 0 };
    gameState.topicStats[q.topic].total++;

    if (correct) {
      sfxCorrect();
      gameState.questionsCorrect++;
      gameState.topicStats[q.topic].correct++;
      let amt = q.reward.amount;
      if (hasUpgrade('epistemic')) amt = Math.round(amt * 1.5);
      applyEffects({ [q.reward.type]: amt });
      addLog(`תשובה נכונה! +${amt} ${q.reward.type === 'energy' ? 'אנרגיה' : q.reward.type === 'shields' ? 'מגנים' : 'דגימות'}`);
    } else {
      sfxWrong();
      addLog('תשובה שגויה.');
    }
    // Show explanation briefly
    pendingQuestion = null;
    const panel = document.querySelector('.cd-epistemic-panel');
    if (panel) {
      panel.innerHTML = `<div class="cd-card" style="border-color:${correct ? 'var(--cd-success)' : 'var(--cd-danger)'}">
        <div style="font-size:14px;margin-bottom:6px;color:${correct ? 'var(--cd-success)' : 'var(--cd-danger)'}">${correct ? 'נכון!' : 'לא נכון'}</div>
        <div style="font-size:12px;line-height:1.5">${q.explanation}</div>
      </div>`;
    }
    // Also update sidebar
    const sidebar = document.querySelector('.cd-sidebar');
    if (sidebar) sidebar.innerHTML = renderSidebar();
  }

  // ─── RENDER: BRIEFING ─────────────────────────────────
  function renderBriefing() {
    const container = document.getElementById('core-diver');
    container.innerHTML = `<div class="core-diver"><div class="cd-briefing-bg">
      <div style="font-size:60px;margin-bottom:16px">🌍</div>
      <h1 class="cd-title" style="font-size:32px;margin-bottom:8px">צוללן הליבה</h1>
      <div style="font-size:14px;color:#888;margin-bottom:24px;font-family:'Orbitron',monospace">CORE DIVER — MISSION BRIEF</div>
      <div class="cd-card" style="max-width:550px;text-align:right;line-height:1.8;font-size:15px">
        <p style="margin-bottom:12px"><strong style="color:var(--cd-accent)">סטטוס:</strong> השדה המגנטי של כדור הארץ נחלש ב-15% בעשורים האחרונים. מודלים מצביעים על תקלה בדינמו של הליבה החיצונית.</p>
        <p style="margin-bottom:12px"><strong style="color:var(--cd-accent)">המשימה:</strong> להוריד את פרוב "צוללן" דרך ארבע שכבות כדור הארץ — קרום, מעטפת, ליבה חיצונית, ליבה פנימית — לאבחן ולתקן את הדינמו.</p>
        <p><strong style="color:var(--cd-accent)">אזהרה:</strong> הפרוב הקודם, "חלוץ-7", איבד קשר בעומק 2,900 ק"מ. היזהרו.</p>
      </div>
      <div class="cd-card" style="max-width:550px;text-align:right;margin-top:16px;line-height:1.8;font-size:13px;border-color:rgba(255,255,255,0.15)">
        <div style="font-size:15px;color:var(--cd-accent);margin-bottom:8px;font-family:'Orbitron',monospace">📖 איך משחקים?</div>
        <p style="margin-bottom:6px"><strong style="color:#00e5ff">🗺️ מפה:</strong> בחרו חדר מהשורה הנוכחית בלחיצה. סוגי חדרים: פאזל ⚡, אירוע 📡, תיקון 🔧, אוצר 🧲, בוס 💀.</p>
        <p style="margin-bottom:6px"><strong style="color:#ffa502">⚡ פאזלים — 3 סוגים:</strong></p>
        <ul style="margin:0 20px 6px 0;font-size:12px;color:#999">
          <li><strong>יישור שדה:</strong> לחצו על חצים כדי לסובב אותם. כל לחיצה מסובבת גם שכנים! כוונו הכל לכיוון המטרה.</li>
          <li><strong>ניווט זרמים:</strong> הזיזו את הפרוב 🔵 ליציאה 🟢 בעזרת כפתורי החצים. הימנעו מ-🔥.</li>
          <li><strong>קוד קוטביות:</strong> שיננו רצף N/S שמוצג לשניות — ואז שחזרו אותו מזיכרון.</li>
        </ul>
        <p style="margin-bottom:6px"><strong style="color:#ffd700">💡 נורת ידע:</strong> אחרי כל חדר מופיעה שאלה בפאנל הימני. תשובה נכונה = בונוס!</p>
        <p><strong style="color:#ff4757">☠️ Game Over:</strong> אם המגנים יורדים ל-0 או החום מגיע ל-100.</p>
      </div>
      <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap;justify-content:center">
        <button class="cd-btn" style="font-size:16px;padding:12px 32px" onclick="CoreDiver._startGame()">🚀 צלול לליבה</button>
      </div>
    </div></div>`;
  }

  function _startGame() {
    sfxZone();
    gameState = newGameState();
    gameState.screen = 'map';
    gameState.map = generateMap(0);
    logMessages = [];
    askedQuestions.clear();
    pendingQuestion = null;
    addLog('מערכות הפרוב פועלות. מתחילים צלילה.');
    calcDepth();
    setPendingQuestion();
    render();
  }

  // ─── RENDER: MAP ──────────────────────────────────────
  function renderMap(mainEl) {
    const map = gameState.map;
    const row = gameState.currentRow;
    const hasSensor = hasUpgrade('sensor');
    let html = `<div class="cd-title" style="font-size:18px">🗺️ מפת הצלילה — ${currentZone().name}</div>`;
    html += '<div style="display:flex;flex-direction:column;align-items:center;gap:20px">';

    for (let r = 0; r < map.length; r++) {
      const nodes = map[r];
      const isCurrentRow = r === row;
      const isPastRow = r < row;
      html += '<div style="display:flex;gap:24px;align-items:center">';
      html += `<div style="font-size:10px;color:#555;width:40px;font-family:'Orbitron',monospace">${r === map.length - 1 ? 'BOSS' : 'R' + (r + 1)}</div>`;
      nodes.forEach((node, n) => {
        let cls = 'cd-map-node';
        if (node.cleared) cls += ' cleared';
        else if (isCurrentRow) cls += ' active';
        if (isPastRow) cls += ' cleared';
        const icon = nodeIcon(node.type, hasSensor || isPastRow || node.cleared);
        const onclick = isCurrentRow && !node.cleared ? `onclick="CoreDiver._selectNode(${r},${n})"` : '';
        html += `<div class="${cls}" ${onclick} title="${nodeLabel(node.type, hasSensor || isPastRow)}">${icon}</div>`;
      });
      html += '</div>';
      // Draw connections
      if (r < map.length - 1) {
        html += '<div style="height:12px;display:flex;justify-content:center"><div style="width:2px;height:12px;background:rgba(255,255,255,0.1)"></div></div>';
      }
    }
    html += '</div>';

    // Treasure shop if samples >= 2
    if (gameState.samples >= 2) {
      html += `<div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px">`;
      html += `<div class="cd-subtitle">🏪 חנות שדרוגים (תשלום בדגימות)</div>`;
      UPGRADES.forEach(u => {
        const owned = hasUpgrade(u.id);
        const canBuy = gameState.samples >= u.cost && !owned;
        html += `<div class="cd-upgrade-card ${owned ? 'owned' : ''}" ${canBuy ? `onclick="CoreDiver._buyUpgrade('${u.id}')"` : ''}>
          <span style="font-size:20px">${u.icon}</span>
          <div style="flex:1">
            <div style="font-size:13px;color:${owned ? 'var(--cd-success)' : '#ccc'}">${u.name}</div>
            <div style="font-size:11px;color:#666">${u.desc}</div>
          </div>
          <div style="font-size:12px;color:var(--cd-samples)">${owned ? '✓' : u.cost + '💎'}</div>
        </div>`;
      });
      html += '</div>';
    }

    mainEl.innerHTML = html;
  }

  function _buyUpgrade(id) {
    const u = UPGRADES.find(x => x.id === id);
    if (!u || hasUpgrade(id) || gameState.samples < u.cost) return;
    sfxClick();
    gameState.samples -= u.cost;
    gameState.upgrades.push(id);
    if (id === 'extra_shields') { gameState.maxShields += 30; gameState.shields = Math.min(gameState.shields + 30, gameState.maxShields); }
    if (id === 'big_battery') { gameState.maxEnergy += 20; gameState.energy = Math.min(gameState.energy + 20, gameState.maxEnergy); }
    addLog(`שדרוג: ${u.name}`);
    render();
  }

  function _selectNode(r, n) {
    if (r !== gameState.currentRow) return;
    sfxClick();
    const node = gameState.map[r][n];
    // Enter room
    switch (node.type) {
      case 'puzzle': enterPuzzle(); break;
      case 'event': enterEvent(); break;
      case 'repair': enterRepair(); break;
      case 'treasure': enterTreasure(); break;
      case 'boss': enterBoss(); break;
    }
  }

  function completeRoom() {
    gameState.roomsCleared++;
    const heatAdd = getHeatIncrease(5);
    gameState.heat = clamp(gameState.heat + heatAdd, 0, gameState.maxHeat);
    if (hasUpgrade('cooling')) addLog('קירור משופר: חום מופחת');

    if (checkGameOver()) return;

    // Mark current row as cleared and advance
    const map = gameState.map;
    map[gameState.currentRow].forEach(n => n.cleared = true);
    gameState.currentRow++;
    calcDepth();
    setPendingQuestion();

    // Check if skip
    if (gameState.skipNextRoom && gameState.currentRow < map.length - 1) {
      gameState.skipNextRoom = false;
      map[gameState.currentRow].forEach(n => n.cleared = true);
      gameState.currentRow++;
      calcDepth();
      addLog('דילוג חדר!');
    }

    // Check zone complete
    if (gameState.currentRow >= map.length) {
      advanceZone();
      return;
    }

    gameState.screen = 'map';
    render();
  }

  function completeBoss() {
    // Check multi-phase boss first
    const boss = BOSSES[gameState.zoneIndex];
    if (boss && boss.type === 'multi' && gameState.bossPhase < boss.phases.length - 1) {
      gameState.bossPhase++;
      addLog('\u05E9\u05DC\u05D1 ' + (gameState.bossPhase + 1) + ' \u05DE\u05EA\u05D5\u05DA ' + boss.phases.length);
      startMultiBossPhase();
      render();
      return;
    }
    const heatAdd = getHeatIncrease(10);
    gameState.heat = clamp(gameState.heat + heatAdd, 0, gameState.maxHeat);
    gameState.roomsCleared++;
    if (checkGameOver()) return;
    gameState.map[gameState.currentRow].forEach(n => n.cleared = true);
    gameState.currentRow++;
    calcDepth();
    setPendingQuestion();
    advanceZone();
  }

  function advanceZone() {
    if (gameState.zoneIndex >= ZONES.length - 1) {
      // Victory!
      gameState.screen = 'victory';
      addLog('הדינמו תוקן! המשימה הצליחה!');
      render();
      return;
    }
    sfxZone();
    gameState.zoneIndex++;
    gameState.currentRow = 0;
    gameState.map = generateMap(gameState.zoneIndex);
    calcDepth();
    applyZoneTheme();
    addLog(`נכנסים לאזור: ${currentZone().name}`);
    gameState.screen = 'zone_transition';
    render();
  }

  // ─── RENDER: ZONE TRANSITION ──────────────────────────
  function renderZoneTransition(mainEl) {
    const z = currentZone();
    mainEl.innerHTML = `<div style="text-align:center;padding:40px 0">
      <div style="font-size:48px;margin-bottom:12px">${z.id === 'mantle' ? '🌋' : z.id === 'outer_core' ? '⚡' : z.id === 'inner_core' ? '💎' : '🪨'}</div>
      <div class="cd-title" style="font-size:26px">${z.name}</div>
      <div style="color:#888;margin-bottom:8px;font-family:'Orbitron',monospace">${z.nameEn} | ${z.depth[0]}-${z.depth[1]} km</div>
      <div style="font-size:14px;margin-bottom:24px;color:#aaa">עומק ${z.depth[0]} ק"מ — הפרוב ממשיך לרדת</div>
      <button class="cd-btn" style="font-size:16px;padding:10px 28px" onclick="CoreDiver._continueFromTransition()">המשך צלילה</button>
    </div>`;
  }

  function _continueFromTransition() {
    sfxClick();
    gameState.screen = 'map';
    render();
  }

  // ─── PUZZLE: FIELD ALIGNMENT ──────────────────────────
  const ARROWS = ['↑','→','↓','←'];

  function enterPuzzle() {
    const types = ['alignment','navigation','polarity'];
    const type = pick(types);
    gameState.screen = 'puzzle';
    switch (type) {
      case 'alignment': startAlignment(false); break;
      case 'navigation': startNavigation(false); break;
      case 'polarity': startPolarity(false); break;
    }
    render();
  }

  function startAlignment(isBoss, size, timer) {
    const zIdx = gameState.zoneIndex;
    const s = size || [3,4,4,5][zIdx];
    const target = rng(0, 3);
    const grid = [];
    for (let r = 0; r < s; r++) {
      grid[r] = [];
      for (let c = 0; c < s; c++) grid[r][c] = rng(0, 3);
    }
    puzzleState = { type: 'alignment', grid, size: s, target, isBoss, timer: timer || null, timeLeft: timer || null, moves: 0 };
    if (timer) {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        puzzleState.timeLeft--;
        renderTimerOnly();
        if (puzzleState.timeLeft <= 0) {
          clearInterval(timerInterval); timerInterval = null;
          alignmentTimeout();
        }
      }, 1000);
    }
    addLog('פאזל: יישור שדה מגנטי');
  }

  function alignmentTimeout() {
    // Count unaligned
    let unaligned = 0;
    const g = puzzleState.grid; const t = puzzleState.target;
    for (let r = 0; r < puzzleState.size; r++)
      for (let c = 0; c < puzzleState.size; c++)
        if (g[r][c] !== t) unaligned++;
    const dmg = unaligned * (puzzleState.isBoss ? (BOSSES[gameState.zoneIndex]?.penalty || 10) : 5);
    gameState.shields = clamp(gameState.shields - dmg, 0, gameState.maxShields);
    if (hasUpgrade('repulsor') && puzzleState.isBoss) gameState.shields = clamp(gameState.shields + 5, 0, gameState.maxShields);
    sfxDamage();
    addLog(`זמן נגמר! ${unaligned} חצים לא מיושרים = -${dmg} מגנים`);
    if (puzzleState.isBoss) completeBoss(); else completeRoom();
  }

  function _clickAlignmentCell(r, c) {
    if (!puzzleState || puzzleState.type !== 'alignment') return;
    sfxClick();
    const g = puzzleState.grid; const s = puzzleState.size;
    // Rotate clicked + neighbors
    const targets = [[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
    targets.forEach(([rr,cc]) => {
      if (rr >= 0 && rr < s && cc >= 0 && cc < s) g[rr][cc] = (g[rr][cc] + 1) % 4;
    });
    puzzleState.moves++;
    // Check win
    const t = puzzleState.target;
    let won = true;
    for (let rr = 0; rr < s && won; rr++)
      for (let cc = 0; cc < s && won; cc++)
        if (g[rr][cc] !== t) won = false;
    if (won) {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      sfxCorrect();
      addLog(`פאזל יישור הושלם ב-${puzzleState.moves} מהלכים!`);
      if (puzzleState.isBoss) completeBoss(); else completeRoom();
      return;
    }
    render();
  }

  function renderAlignment(mainEl) {
    const ps = puzzleState;
    let html = `<div class="cd-title" style="font-size:16px">⚡ יישור שדה מגנטי</div>`;
    html += `<div class="cd-card" style="margin-bottom:12px;font-size:12px;line-height:1.6;border-color:rgba(255,255,255,0.1)">
      <strong style="color:var(--cd-accent)">מטרה:</strong> כוונו את <strong>כל</strong> החצים לכיוון <span style="font-size:22px;color:var(--cd-accent)">${ARROWS[ps.target]}</span><br>
      <strong style="color:var(--cd-accent)">איך:</strong> לחצו על חץ כדי לסובב אותו 90° — אבל גם 4 השכנים שלו יסתובבו! (כמו Lights Out)<br>
      <span style="color:#666">חצים שכבר בכיוון הנכון מסומנים בירוק.</span>
    </div>`;
    if (ps.timer) html += `<div id="cd-timer" style="font-family:'Orbitron',monospace;font-size:18px;color:${ps.timeLeft <= 10 ? 'var(--cd-danger)' : 'var(--cd-accent)'};margin-bottom:8px">⏱️ ${ps.timeLeft}s</div>`;
    html += '<div style="display:inline-grid;gap:2px;" style="direction:ltr">';
    for (let r = 0; r < ps.size; r++) {
      html += '<div style="display:flex;gap:2px">';
      for (let c = 0; c < ps.size; c++) {
        const correct = ps.grid[r][c] === ps.target;
        html += `<div class="cd-grid-cell" style="${correct ? 'background:rgba(46,213,115,0.15);border-color:var(--cd-success)' : ''}" onclick="CoreDiver._clickAlignmentCell(${r},${c})">${ARROWS[ps.grid[r][c]]}</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    html += `<div style="margin-top:8px;font-size:11px;color:#666">מהלכים: ${ps.moves}</div>`;
    html += `<div style="margin-top:14px"><button class="cd-btn cd-btn-sm cd-btn-danger" onclick="CoreDiver._skipPuzzle()">⏭️ דלג (−10 מגנים)</button></div>`;
    mainEl.innerHTML = html;
  }

  function renderTimerOnly() {
    const el = document.getElementById('cd-timer');
    if (el && puzzleState) {
      el.textContent = puzzleState.timeLeft + 's';
      el.style.color = puzzleState.timeLeft <= 10 ? 'var(--cd-danger)' : 'var(--cd-accent)';
    }
  }

  // ─── PUZZLE: CURRENT NAVIGATION ───────────────────────
  function startNavigation(isBoss, size, maxSteps) {
    const s = size || 6;
    const steps = maxSteps || rng(15, 20);
    const grid = [];
    for (let r = 0; r < s; r++) {
      grid[r] = [];
      for (let c = 0; c < s; c++) {
        grid[r][c] = { type: 'empty', current: null };
      }
    }
    // Place walls (~15%)
    const wallCount = Math.floor(s * s * 0.12);
    for (let i = 0; i < wallCount; i++) {
      const wr = rng(0, s-1), wc = rng(0, s-1);
      if ((wr === 0 && wc === 0) || (wr === s-1 && wc === s-1)) continue;
      grid[wr][wc].type = 'wall';
    }
    // Place hot zones (~10%)
    const hotCount = Math.floor(s * s * (isBoss ? 0.15 : 0.1));
    for (let i = 0; i < hotCount; i++) {
      const hr = rng(0, s-1), hc = rng(0, s-1);
      if (grid[hr][hc].type !== 'empty') continue;
      if ((hr === 0 && hc === 0) || (hr === s-1 && hc === s-1)) continue;
      grid[hr][hc].type = 'hot';
    }
    // Place current arrows (~20%)
    const currDirs = ['↑','→','↓','←'];
    const currCount = Math.floor(s * s * 0.2);
    for (let i = 0; i < currCount; i++) {
      const cr = rng(0, s-1), cc = rng(0, s-1);
      if (grid[cr][cc].type !== 'empty') continue;
      grid[cr][cc].current = pick(currDirs);
    }
    grid[0][0] = { type: 'empty', current: null };
    grid[s-1][s-1] = { type: 'exit', current: null };

    puzzleState = { type: 'navigation', grid, size: s, playerR: 0, playerC: 0, stepsLeft: steps, maxSteps: steps, isBoss, turnCount: 0, hotMoveInterval: isBoss ? (BOSSES[gameState.zoneIndex]?.hotMove || 2) : 999 };
    addLog('פאזל: ניווט בזרמים');
  }

  function _moveNav(dr, dc) {
    if (!puzzleState || puzzleState.type !== 'navigation') return;
    sfxClick();
    const ps = puzzleState;
    const nr = ps.playerR + dr, nc = ps.playerC + dc;
    if (nr < 0 || nr >= ps.size || nc < 0 || nc >= ps.size) return;
    if (ps.grid[nr][nc].type === 'wall') return;

    ps.playerR = nr; ps.playerC = nc; ps.stepsLeft--; ps.turnCount++;

    // Check hot
    if (ps.grid[nr][nc].type === 'hot') {
      const dmg = ps.isBoss ? (BOSSES[gameState.zoneIndex]?.penalty || 15) : 10;
      const actualDmg = hasUpgrade('repulsor') && ps.isBoss ? dmg - 5 : dmg;
      gameState.shields = clamp(gameState.shields - actualDmg, 0, gameState.maxShields);
      sfxDamage();
      addLog(`אזור חם! -${actualDmg} מגנים`);
    }

    // Check exit
    if (ps.grid[nr][nc].type === 'exit') {
      sfxCorrect();
      addLog('ניווט הושלם!');
      if (ps.isBoss) completeBoss(); else completeRoom();
      return;
    }

    // Check steps
    if (ps.stepsLeft <= 0) {
      sfxDamage();
      gameState.shields = clamp(gameState.shields - 15, 0, gameState.maxShields);
      addLog('נגמרו הצעדים! -15 מגנים');
      if (ps.isBoss) completeBoss(); else completeRoom();
      return;
    }

    // Move hot zones periodically (boss)
    if (ps.isBoss && ps.turnCount % ps.hotMoveInterval === 0) {
      moveHotZones(ps);
    }

    if (checkGameOver()) return;
    render();
  }

  function moveHotZones(ps) {
    const s = ps.size;
    // Clear old hot zones and place new ones
    const hotCells = [];
    for (let r = 0; r < s; r++)
      for (let c = 0; c < s; c++)
        if (ps.grid[r][c].type === 'hot') { ps.grid[r][c].type = 'empty'; hotCells.push([r,c]); }
    hotCells.forEach(([r,c]) => {
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      const d = pick(dirs);
      let nr = clamp(r + d[0], 0, s-1), nc = clamp(c + d[1], 0, s-1);
      if (ps.grid[nr][nc].type === 'empty' && !(nr === ps.playerR && nc === ps.playerC) && !(nr === 0 && nc === 0) && !(nr === s-1 && nc === s-1)) {
        ps.grid[nr][nc].type = 'hot';
      } else {
        ps.grid[r][c].type = 'hot';
      }
    });
    addLog('אזורים חמים זזו!');
  }

  function renderNavigation(mainEl) {
    const ps = puzzleState;
    let html = `<div class="cd-title" style="font-size:16px">📡 ניווט בזרמים</div>`;
    html += `<div class="cd-card" style="margin-bottom:12px;font-size:12px;line-height:1.6;border-color:rgba(255,255,255,0.1)">
      <strong style="color:var(--cd-accent)">מטרה:</strong> הזיזו את הפרוב 🔵 ליציאה 🟢 (פינה ימנית-תחתונה)<br>
      <strong style="color:var(--cd-accent)">איך:</strong> השתמשו בכפתורי החצים למטה כדי לזוז. █ = קיר, 🔥 = אזור חם (פוגע במגנים)<br>
      <span style="color:#666">צעדים שנותרו: <span style="color:${ps.stepsLeft <= 5 ? 'var(--cd-danger)' : 'var(--cd-accent)'};font-family:'Orbitron',monospace">${ps.stepsLeft}</span></span>
    </div>`;
    html += '<div style="display:inline-block;margin-bottom:10px" dir="ltr">';
    for (let r = 0; r < ps.size; r++) {
      html += '<div style="display:flex">';
      for (let c = 0; c < ps.size; c++) {
        const cell = ps.grid[r][c];
        const isPlayer = r === ps.playerR && c === ps.playerC;
        let cls = 'cd-grid-cell cd-nav-cell';
        let content = '';
        if (isPlayer) { cls += ' player'; content = '🔵'; }
        else if (cell.type === 'wall') { cls += ' wall'; content = '█'; }
        else if (cell.type === 'hot') { cls += ' hot'; content = '🔥'; }
        else if (cell.type === 'exit') { cls += ' exit'; content = '🟢'; }
        else if (cell.current) { content = cell.current; }
        html += `<div class="${cls}">${content}</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    // Direction buttons
    html += `<div style="display:grid;grid-template-columns:40px 40px 40px;gap:4px;justify-content:center;margin-top:8px">
      <div></div><button class="cd-btn cd-btn-sm" onclick="CoreDiver._moveNav(-1,0)">↑</button><div></div>
      <button class="cd-btn cd-btn-sm" onclick="CoreDiver._moveNav(0,1)">→</button>
      <button class="cd-btn cd-btn-sm" onclick="CoreDiver._moveNav(1,0)">↓</button>
      <button class="cd-btn cd-btn-sm" onclick="CoreDiver._moveNav(0,-1)">←</button>
    </div>`;
    html += `<div style="margin-top:14px"><button class="cd-btn cd-btn-sm cd-btn-danger" onclick="CoreDiver._skipPuzzle()">⏭️ דלג (−10 מגנים)</button></div>`;
    mainEl.innerHTML = html;
  }

  // --- PUZZLE: POLARITY CODE ----
  function startPolarity(isBoss, length, fast) {
    const zIdx = gameState.zoneIndex;
    const len = length || [4,6,8,10][zIdx];
    const seq = [];
    for (let i = 0; i < len; i++) seq.push(Math.random() < 0.5 ? 'N' : 'S');
    const displayTime = fast ? 1500 : 2000;
    puzzleState = { type: 'polarity', sequence: seq, playerSeq: [], phase: 'show', length: len, isBoss, noise: isBoss && BOSSES[gameState.zoneIndex] && BOSSES[gameState.zoneIndex].noise, displayTime };
    addLog('\u05E4\u05D0\u05D6\u05DC: \u05E7\u05D5\u05D3 \u05E7\u05D5\u05D8\u05D1\u05D9\u05D5\u05EA');
    setTimeout(() => {
      if (puzzleState && puzzleState.type === 'polarity' && puzzleState.phase === 'show') {
        puzzleState.phase = 'input';
        render();
      }
    }, displayTime);
  }

  function _polarityInput(val) {
    if (!puzzleState || puzzleState.type !== 'polarity' || puzzleState.phase !== 'input') return;
    sfxClick();
    puzzleState.playerSeq.push(val);
    const idx = puzzleState.playerSeq.length - 1;
    if (puzzleState.playerSeq[idx] !== puzzleState.sequence[idx]) {
      sfxWrong();
      const dmg = puzzleState.isBoss ? (BOSSES[gameState.zoneIndex] ? BOSSES[gameState.zoneIndex].penalty : 10) : 8;
      const actualDmg = hasUpgrade('repulsor') && puzzleState.isBoss ? dmg - 5 : dmg;
      gameState.shields = clamp(gameState.shields - actualDmg, 0, gameState.maxShields);
      addLog('\u05E8\u05E6\u05E3 \u05E9\u05D2\u05D5\u05D9! -' + actualDmg + ' \u05DE\u05D2\u05E0\u05D9\u05DD');
      if (checkGameOver()) return;
      if (puzzleState.isBoss) completeBoss(); else completeRoom();
      return;
    }
    if (puzzleState.playerSeq.length === puzzleState.sequence.length) {
      sfxCorrect();
      addLog('\u05E7\u05D5\u05D3 \u05E7\u05D5\u05D8\u05D1\u05D9\u05D5\u05EA \u05E0\u05E4\u05EA\u05D7!');
      if (puzzleState.isBoss) completeBoss(); else completeRoom();
      return;
    }
    render();
  }

  function renderPolarity(mainEl) {
    const ps = puzzleState;
    let html = '<div class="cd-title" style="font-size:16px">🧲 קוד קוטביות</div>';
    const noiseClass = ps.noise ? ' cd-noise' : '';
    if (ps.phase === 'show') {
      html += '<div class="cd-card" style="margin-bottom:12px;font-size:12px;line-height:1.6;border-color:rgba(255,255,255,0.1)">';
      html += '<strong style="color:var(--cd-accent)">שיננו את הרצף!</strong> הוא ייעלם עוד רגע. אחר כך תצטרכו לשחזר אותו בלחיצה על N (צפון) ו-S (דרום).';
      html += '</div>';
      html += '<div style="margin-bottom:8px;font-size:14px;color:var(--cd-accent)">👀 זכרו את הרצף!</div>';
      html += '<div class="' + noiseClass + '" style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin:16px 0">';
      ps.sequence.forEach(function(s) {
        html += '<div class="cd-pol-block ' + (s === 'N' ? 'cd-pol-n' : 'cd-pol-s') + '">' + s + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="cd-card" style="margin-bottom:12px;font-size:12px;line-height:1.6;border-color:rgba(255,255,255,0.1)">';
      html += '<strong style="color:var(--cd-accent)">שחזרו:</strong> לחצו על <span style="color:var(--cd-shields)">N צפון</span> או <span style="color:var(--cd-danger)">S דרום</span> לפי הסדר שזכרתם. טעות = נזק!';
      html += '</div>';
      html += '<div style="margin-bottom:8px;font-size:13px">התקדמות: ' + ps.playerSeq.length + '/' + ps.length + '</div>';
      html += '<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin:12px 0;min-height:50px">';
      ps.playerSeq.forEach(function(s) {
        html += '<div class="cd-pol-block ' + (s === 'N' ? 'cd-pol-n' : 'cd-pol-s') + '">' + s + '</div>';
      });
      for (var i = ps.playerSeq.length; i < ps.length; i++) {
        html += '<div class="cd-pol-block" style="border-color:rgba(255,255,255,0.1);color:#333">?</div>';
      }
      html += '</div>';
      html += '<div style="display:flex;gap:12px;justify-content:center;margin-top:16px">';
      html += "<button class=\"cd-btn\" style=\"min-width:100px;padding:10px 20px;font-size:15px;border-color:var(--cd-shields);color:var(--cd-shields)\" onclick=\"CoreDiver._polarityInput('N')\">N צפון</button>";
      html += "<button class=\"cd-btn\" style=\"min-width:100px;padding:10px 20px;font-size:15px;border-color:var(--cd-danger);color:var(--cd-danger)\" onclick=\"CoreDiver._polarityInput('S')\">S דרום</button>";
      html += '</div>';
      html += '<div style="margin-top:14px"><button class="cd-btn cd-btn-sm cd-btn-danger" onclick="CoreDiver._skipPuzzle()">⏭️ דלג (−10 מגנים)</button></div>';
    }
    mainEl.innerHTML = html;
  }


  // ─── PUZZLE: POLARITY CODE (Hebrew) ───────────────────
  // (already appended above but with English placeholders — overwriting renderPolarity)

  // ─── EVENT ────────────────────────────────────────────
  function enterEvent() {
    const zId = currentZoneId();
    const pool = EVENTS[zId];
    const evt = pick(pool);
    puzzleState = { type: 'event', event: evt };
    gameState.screen = 'event';
    addLog('\u05D0\u05D9\u05E8\u05D5\u05E2: ' + evt.title);
    render();
  }

  function _eventChoice(idx) {
    sfxClick();
    const evt = puzzleState.event;
    const choice = evt.choices[idx];
    applyEffects(choice.effects);
    addLog(choice.text + ': ' + choice.effectText);
    if (checkGameOver()) return;
    completeRoom();
  }

  function renderEvent(mainEl) {
    const evt = puzzleState.event;
    let html = '<div class="cd-title" style="font-size:16px">' + evt.icon + ' ' + evt.title + '</div>';
    html += '<div class="cd-card" style="line-height:1.8;font-size:14px;margin-bottom:16px">' + evt.description + '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    evt.choices.forEach(function(ch, i) {
      html += '<button class="cd-btn" style="text-align:right;display:flex;align-items:center;gap:8px" onclick="CoreDiver._eventChoice(' + i + ')">';
      html += '<span style="font-size:20px">' + ch.icon + '</span>';
      html += '<span style="flex:1">' + ch.text + '<br><span style="font-size:11px;color:#888">' + ch.effectText + '</span></span>';
      html += '</button>';
    });
    html += '</div>';
    mainEl.innerHTML = html;
  }

  // ─── REPAIR ───────────────────────────────────────────
  function enterRepair() {
    puzzleState = { type: 'repair' };
    gameState.screen = 'repair';
    addLog('\u05EA\u05D7\u05E0\u05EA \u05EA\u05D9\u05E7\u05D5\u05DF');
    render();
  }

  function _doRepair(type) {
    sfxClick();
    if (type === 'shields') {
      const amt = Math.min(30, gameState.maxShields - gameState.shields);
      gameState.shields = clamp(gameState.shields + 30, 0, gameState.maxShields);
      addLog('+' + amt + ' \u05DE\u05D2\u05E0\u05D9\u05DD');
    } else if (type === 'heat') {
      const before = gameState.heat;
      gameState.heat = clamp(gameState.heat - 15, 0, gameState.maxHeat);
      addLog('-' + (before - gameState.heat) + ' \u05D7\u05D5\u05DD');
    } else if (type === 'energy') {
      const amt = Math.min(25, gameState.maxEnergy - gameState.energy);
      gameState.energy = clamp(gameState.energy + 25, 0, gameState.maxEnergy);
      addLog('+' + amt + ' \u05D0\u05E0\u05E8\u05D2\u05D9\u05D4');
    }
    completeRoom();
  }

  function renderRepair(mainEl) {
    let html = '<div class="cd-title" style="font-size:16px">\uD83D\uDD27 \u05EA\u05D7\u05E0\u05EA \u05EA\u05D9\u05E7\u05D5\u05DF</div>';
    html += '<div style="font-size:13px;margin-bottom:16px;color:#aaa">\u05D1\u05D7\u05E8 \u05E4\u05E2\u05D5\u05DC\u05EA \u05EA\u05D9\u05E7\u05D5\u05DF \u05D0\u05D7\u05EA:</div>';
    html += '<div style="display:flex;flex-direction:column;gap:10px;max-width:350px">';
    html += '<button class="cd-btn" onclick="CoreDiver._doRepair(\'shields\')">\uD83D\uDEE1\uFE0F \u05EA\u05D9\u05E7\u05D5\u05DF \u05DE\u05D2\u05E0\u05D9\u05DD (+30)</button>';
    html += '<button class="cd-btn" onclick="CoreDiver._doRepair(\'heat\')">\u2744\uFE0F \u05E7\u05D9\u05E8\u05D5\u05E8 (-15 \u05D7\u05D5\u05DD)</button>';
    html += '<button class="cd-btn" onclick="CoreDiver._doRepair(\'energy\')">\uD83D\uDD0B \u05D8\u05E2\u05D9\u05E0\u05EA \u05D0\u05E0\u05E8\u05D2\u05D9\u05D4 (+25)</button>';
    html += '</div>';
    mainEl.innerHTML = html;
  }

  // ─── TREASURE ─────────────────────────────────────────
  function enterTreasure() {
    const rewards = [
      { text: '+3 \u05D3\u05D2\u05D9\u05DE\u05D5\u05EA', effects: { samples: 3 } },
      { text: '+20 \u05D0\u05E0\u05E8\u05D2\u05D9\u05D4', effects: { energy: 20 } },
      { text: '+15 \u05DE\u05D2\u05E0\u05D9\u05DD', effects: { shields: 15 } },
      { text: '+2 \u05D3\u05D2\u05D9\u05DE\u05D5\u05EA, +10 \u05D0\u05E0\u05E8\u05D2\u05D9\u05D4', effects: { samples: 2, energy: 10 } }
    ];
    const reward = pick(rewards);
    applyEffects(reward.effects);
    addLog('\u05D0\u05D5\u05E6\u05E8! ' + reward.text);
    puzzleState = { type: 'treasure', reward: reward };
    gameState.screen = 'treasure';
    sfxCorrect();
    render();
  }

  function _closeTreasure() { sfxClick(); completeRoom(); }

  function renderTreasure(mainEl) {
    const r = puzzleState.reward;
    mainEl.innerHTML = '<div style="text-align:center;padding:30px 0">' +
      '<div style="font-size:48px;margin-bottom:12px">\uD83E\uDDF2</div>' +
      '<div class="cd-title" style="font-size:18px">\u05D0\u05D5\u05E6\u05E8!</div>' +
      '<div class="cd-card" style="display:inline-block;font-size:16px;color:var(--cd-samples)">' + r.text + '</div>' +
      '<div style="margin-top:16px"><button class="cd-btn" onclick="CoreDiver._closeTreasure()">\u05D4\u05DE\u05E9\u05DA</button></div>' +
      '</div>';
  }


  // ─── BOSS FIGHTS ──────────────────────────────────────
  function enterBoss() {
    const boss = BOSSES[gameState.zoneIndex];
    puzzleState = { type: 'boss_intro', boss: boss };
    gameState.screen = 'boss_intro';
    addLog('\u05D1\u05D5\u05E1: ' + boss.name);
    render();
  }

  function _startBoss() {
    sfxClick();
    const boss = puzzleState.boss;
    gameState.screen = 'puzzle';
    if (boss.type === 'alignment') {
      startAlignment(true, boss.size, boss.timer);
    } else if (boss.type === 'navigation') {
      startNavigation(true, boss.size, 20);
    } else if (boss.type === 'polarity') {
      startPolarity(true, boss.length, false);
    } else if (boss.type === 'multi') {
      gameState.bossPhase = 0;
      startMultiBossPhase();
    }
    render();
  }

  function startMultiBossPhase() {
    const boss = BOSSES[gameState.zoneIndex];
    const phase = boss.phases[gameState.bossPhase];
    if (phase.type === 'alignment') {
      startAlignment(true, phase.size, phase.timer);
    } else if (phase.type === 'navigation') {
      startNavigation(true, phase.size, phase.steps);
    } else if (phase.type === 'polarity') {
      startPolarity(true, phase.length, phase.fast);
    }
  }

  function renderBossIntro(mainEl) {
    const boss = puzzleState.boss;
    mainEl.innerHTML = '<div style="text-align:center;padding:30px 0">' +
      '<div style="font-size:48px;margin-bottom:12px">\uD83D\uDC80</div>' +
      '<div class="cd-title" style="font-size:24px">' + boss.name + '</div>' +
      '<div style="color:#888;margin-bottom:8px;font-family:\'Orbitron\',monospace">\u05E2\u05D5\u05DE\u05E7: ' + boss.depth + ' \u05E7"\u05DE</div>' +
      '<div class="cd-card" style="display:inline-block;max-width:400px;text-align:right;line-height:1.6">' +
      (boss.type === 'alignment' ? '\u05E4\u05D0\u05D6\u05DC \u05D9\u05D9\u05E9\u05D5\u05E8 ' + boss.size + 'x' + boss.size + ' \u05E2\u05DD \u05D8\u05D9\u05D9\u05DE\u05E8 ' + boss.timer + ' \u05E9\u05E0\u05D9\u05D5\u05EA' :
       boss.type === 'navigation' ? '\u05E0\u05D9\u05D5\u05D5\u05D8 ' + boss.size + 'x' + boss.size + ', \u05D0\u05D6\u05D5\u05E8\u05D9\u05DD \u05D7\u05DE\u05D9\u05DD \u05D6\u05D6\u05D9\u05DD' :
       boss.type === 'polarity' ? '\u05E7\u05D5\u05D3 \u05E7\u05D5\u05D8\u05D1\u05D9\u05D5\u05EA ' + boss.length + ' \u05E1\u05DE\u05DC\u05D9\u05DD \u05E2\u05DD \u05E8\u05E2\u05E9 \u05D7\u05D6\u05D5\u05EA\u05D9' :
       '\u05D1\u05D5\u05E1 \u05E1\u05D5\u05E4\u05D9 \u2014 3 \u05E9\u05DC\u05D1\u05D9\u05DD!') +
      '</div>' +
      '<div style="margin-top:16px"><button class="cd-btn cd-btn-danger" style="font-size:16px;padding:10px 28px" onclick="CoreDiver._startBoss()">\u2694\uFE0F \u05DC\u05D4\u05D9\u05DC\u05D7\u05DD!</button></div>' +
      '</div>';
  }

  // ─── VICTORY / GAME OVER ──────────────────────────────
  function renderVictory(container) {
    const s = gameState;
    let topicHtml = '';
    Object.keys(s.topicStats).forEach(function(t) {
      const st = s.topicStats[t];
      topicHtml += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05)">' +
        '<span>' + t + '</span><span style="color:var(--cd-success)">' + st.correct + '/' + st.total + '</span></div>';
    });
    container.innerHTML = '<div class="core-diver"><div class="cd-fullscreen" style="background:#050510">' +
      '<div style="font-size:60px;margin-bottom:12px">\uD83C\uDF1F</div>' +
      '<div class="cd-title" style="font-size:28px;color:#00ffff">\u05D4\u05DE\u05E9\u05D9\u05DE\u05D4 \u05D4\u05E6\u05DC\u05D9\u05D7\u05D4!</div>' +
      '<div style="color:#aaa;margin-bottom:20px">\u05D4\u05D3\u05D9\u05E0\u05DE\u05D5 \u05EA\u05D5\u05E7\u05DF. \u05D4\u05E9\u05D3\u05D4 \u05D4\u05DE\u05D2\u05E0\u05D8\u05D9 \u05E9\u05DC \u05DB\u05D3\u05D5\u05E8 \u05D4\u05D0\u05E8\u05E5 \u05D7\u05D5\u05D6\u05E8 \u05DC\u05E4\u05E2\u05D5\u05DC.</div>' +
      '<div class="cd-card" style="max-width:400px;width:100%;text-align:right">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
      '<div>\uD83D\uDEE1\uFE0F \u05DE\u05D2\u05E0\u05D9\u05DD: ' + s.shields + '</div>' +
      '<div>\u26A1 \u05D0\u05E0\u05E8\u05D2\u05D9\u05D4: ' + s.energy + '</div>' +
      '<div>\uD83C\uDF21\uFE0F \u05D7\u05D5\u05DD: ' + s.heat + '</div>' +
      '<div>\uD83D\uDC8E \u05D3\u05D2\u05D9\u05DE\u05D5\u05EA: ' + s.samples + '</div>' +
      '<div>\u2705 \u05D7\u05D3\u05E8\u05D9\u05DD: ' + s.roomsCleared + '</div>' +
      '<div>\uD83C\uDFAF \u05E9\u05D0\u05DC\u05D5\u05EA: ' + s.questionsCorrect + '/' + s.questionsTotal + '</div>' +
      '</div>' +
      '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;font-size:13px">' +
      '<div style="margin-bottom:6px;color:var(--cd-accent)">\u05E1\u05D9\u05DB\u05D5\u05DD \u05DC\u05E4\u05D9 \u05E0\u05D5\u05E9\u05D0:</div>' +
      topicHtml +
      '</div></div>' +
      '<div style="display:flex;gap:12px;margin-top:20px">' +
      '<button class="cd-btn" onclick="CoreDiver._startGame()">\uD83D\uDD01 \u05E9\u05D7\u05E7 \u05E9\u05D5\u05D1</button>' +
      '<button class="cd-btn cd-btn-success" onclick="CoreDiver._backToSim()">\u2B05 \u05D7\u05D6\u05E8\u05D4 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8</button>' +
      '</div></div></div>';
  }

  function renderGameOver(container) {
    const s = gameState;
    const reason = s.gameOverReason === 'heat' ? '\u05D4\u05EA\u05D7\u05DE\u05DE\u05D5\u05EA \u05E7\u05E8\u05D9\u05D8\u05D9\u05EA \u2014 \u05D4\u05E4\u05E8\u05D5\u05D1 \u05E0\u05DE\u05E1' : '\u05DE\u05D2\u05E0\u05D9\u05DD \u05D4\u05D5\u05E9\u05DE\u05D3\u05D5 \u2014 \u05D4\u05E4\u05E8\u05D5\u05D1 \u05E0\u05D4\u05E8\u05E1';
    let topicHtml = '';
    Object.keys(s.topicStats).forEach(function(t) {
      const st = s.topicStats[t];
      topicHtml += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05)">' +
        '<span>' + t + '</span><span style="color:var(--cd-danger)">' + st.correct + '/' + st.total + '</span></div>';
    });
    container.innerHTML = '<div class="core-diver"><div class="cd-fullscreen" style="background:#100505">' +
      '<div style="font-size:60px;margin-bottom:12px">\uD83D\uDCA5</div>' +
      '<div class="cd-title" style="font-size:28px;color:var(--cd-danger)">\u05D4\u05DE\u05E9\u05D9\u05DE\u05D4 \u05E0\u05DB\u05E9\u05DC\u05D4</div>' +
      '<div style="color:#aaa;margin-bottom:20px">' + reason + '</div>' +
      '<div class="cd-card" style="max-width:400px;width:100%;text-align:right">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
      '<div>\u05E2\u05D5\u05DE\u05E7: ' + s.depth + ' \u05E7"\u05DE</div>' +
      '<div>\u05D7\u05D3\u05E8\u05D9\u05DD: ' + s.roomsCleared + '</div>' +
      '<div>\u05D3\u05D2\u05D9\u05DE\u05D5\u05EA: ' + s.samples + '</div>' +
      '<div>\u05E9\u05D0\u05DC\u05D5\u05EA: ' + s.questionsCorrect + '/' + s.questionsTotal + '</div>' +
      '</div>' +
      (topicHtml ? '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;font-size:13px">' +
      '<div style="margin-bottom:6px;color:var(--cd-accent)">\u05E1\u05D9\u05DB\u05D5\u05DD \u05DC\u05E4\u05D9 \u05E0\u05D5\u05E9\u05D0:</div>' +
      topicHtml + '</div>' : '') +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:20px">' +
      '<button class="cd-btn" onclick="CoreDiver._startGame()">\uD83D\uDD01 \u05E0\u05E1\u05D9\u05D5\u05DF \u05E0\u05D5\u05E1\u05E3</button>' +
      '<button class="cd-btn cd-btn-success" onclick="CoreDiver._backToSim()">\u2B05 \u05D7\u05D6\u05E8\u05D4 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8</button>' +
      '</div></div></div>';
  }

  function _quitGame() {
    sfxClick();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    gameState = newGameState();
    logMessages = [];
    askedQuestions.clear();
    pendingQuestion = null;
    puzzleState = null;
    render();
  }

  function _skipPuzzle() {
    sfxDamage();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    gameState.shields = clamp(gameState.shields - 10, 0, gameState.maxShields);
    addLog('פאזל דולג. -10 מגנים');
    if (checkGameOver()) return;
    if (puzzleState && puzzleState.isBoss) completeBoss(); else completeRoom();
  }

  function _backToSim() {
    if (typeof showPage === 'function') showPage('earth');
  }


  // ─── MAIN RENDER ──────────────────────────────────────
  function render() {
    const container = document.getElementById('core-diver');
    if (!container) return;

    const screen = gameState ? gameState.screen : 'briefing';

    // Fullscreen screens
    if (screen === 'briefing') { renderBriefing(); return; }
    if (screen === 'victory') { renderVictory(container); return; }
    if (screen === 'gameover') { renderGameOver(container); return; }

    // Game layout
    applyZoneTheme();
    container.innerHTML = '<div class="core-diver"><div class="cd-layout">' +
      '<div class="cd-header">' + renderHeader() + '</div>' +
      '<div class="cd-sidebar">' + renderSidebar() + '</div>' +
      '<div class="cd-main" id="cd-main-area"></div>' +
      '<div class="cd-epistemic-panel">' + renderEpistemicPanel() + '</div>' +
      '<div class="cd-bottom">' + renderBottom() + '</div>' +
      '</div>' +
      '<button class="cd-lamp cd-lamp-active" id="cd-mobile-lamp" style="display:none;position:fixed;bottom:70px;left:16px;z-index:50;background:rgba(0,0,0,0.7);border:1px solid var(--cd-accent)" onclick="CoreDiver._toggleMobileEpistemic()">💡</button>' +
      '<div class="cd-epistemic-modal" id="cd-mobile-epistemic" style="display:none;position:fixed;bottom:100px;left:16px;z-index:50;background:var(--cd-bg);border:1px solid var(--cd-accent);border-radius:8px;padding:12px;width:280px;max-height:300px;overflow-y:auto">' + renderEpistemicPanel() + '</div>' +
      '</div>';

    const mainEl = document.getElementById('cd-main-area');
    if (!mainEl) return;

    switch (screen) {
      case 'map': renderMap(mainEl); break;
      case 'zone_transition': renderZoneTransition(mainEl); break;
      case 'puzzle':
        if (puzzleState) {
          if (puzzleState.type === 'alignment') renderAlignment(mainEl);
          else if (puzzleState.type === 'navigation') renderNavigation(mainEl);
          else if (puzzleState.type === 'polarity') renderPolarity(mainEl);
        }
        break;
      case 'event': renderEvent(mainEl); break;
      case 'repair': renderRepair(mainEl); break;
      case 'treasure': renderTreasure(mainEl); break;
      case 'boss_intro': renderBossIntro(mainEl); break;
    }

    // Show mobile lamp button on small screens
    if (window.innerWidth <= 768) {
      const lamp = document.getElementById('cd-mobile-lamp');
      if (lamp) lamp.style.display = pendingQuestion ? 'flex' : 'none';
    }
  }

  let mobileEpistemicOpen = false;
  function _toggleMobileEpistemic() {
    mobileEpistemicOpen = !mobileEpistemicOpen;
    const el = document.getElementById('cd-mobile-epistemic');
    if (el) el.style.display = mobileEpistemicOpen ? 'block' : 'none';
  }


  // ─── INIT / SHOW / HIDE ──────────────────────────────
  function init() {
    const container = document.getElementById('core-diver');
    if (!container || initialized) return;
    initialized = true;
    injectStyles();
    gameState = newGameState();
    render();
  }

  function onShow() {
    visible = true;
    if (!initialized) init();
    else render();
  }

  function onHide() {
    visible = false;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  // ─── PUBLIC API ───────────────────────────────────────
  return {
    init: init,
    onShow: onShow,
    onHide: onHide,
    _startGame: _startGame,
    _selectNode: _selectNode,
    _buyUpgrade: _buyUpgrade,
    _continueFromTransition: _continueFromTransition,
    _clickAlignmentCell: _clickAlignmentCell,
    _moveNav: _moveNav,
    _polarityInput: _polarityInput,
    _eventChoice: _eventChoice,
    _doRepair: _doRepair,
    _closeTreasure: _closeTreasure,
    _startBoss: _startBoss,
    _answerQuestion: _answerQuestion,
    _skipPuzzle: _skipPuzzle,
    _quitGame: _quitGame,
    _backToSim: _backToSim,
    _toggleMobileEpistemic: _toggleMobileEpistemic
  };
})();
