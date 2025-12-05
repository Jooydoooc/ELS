// app.js

let selectedVoice = null;
let availableVoices = [];
let questionAnswered = false;
let exerciseSessionActive = false;
let exerciseStatusSent = false;

// Voice loading
function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  const englishVoices = voices.filter(
    (voice) => voice.lang && voice.lang.startsWith("en")
  );
  availableVoices = (englishVoices.length ? englishVoices : voices).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const preferredVoices = [
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Microsoft Guy Online (Natural) - English (United States)",
    "Google US English",
    "Google UK English Female",
    "Google UK English Male",
  ];

  const savedVoiceName = localStorage.getItem("elsPreferredVoice");
  if (savedVoiceName) {
    const savedVoice = availableVoices.find((v) => v.name === savedVoiceName);
    if (savedVoice) {
      selectedVoice = savedVoice;
    }
  }

  if (!selectedVoice) {
    for (let name of preferredVoices) {
      const found = availableVoices.find((v) => v.name === name);
      if (found) {
        selectedVoice = found;
        break;
      }
    }
  }

  if (!selectedVoice) {
    selectedVoice =
      availableVoices.find((v) => /Microsoft|Google/i.test(v.name)) ||
      availableVoices[0];
  }

  populateVoiceSelector();
}

function populateVoiceSelector() {
  const selector = document.getElementById("voiceSelector");
  if (!selector) return;

  selector.innerHTML = "";

  if (!availableVoices.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Voices unavailable";
    selector.appendChild(option);
    selector.disabled = true;
    return;
  }

  selector.disabled = false;
  availableVoices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (selectedVoice && voice.name === selectedVoice.name) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
}

function changeVoice(voiceName) {
  if (!voiceName) return;
  const voice = availableVoices.find((v) => v.name === voiceName);
  if (voice) {
    selectedVoice = voice;
    localStorage.setItem("elsPreferredVoice", voice.name);
  }
}

function createUtterance(text, rate = 0.95) {
  const utterance = new SpeechSynthesisUtterance(text);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = "en-US";
  }
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  return utterance;
}

if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

// Global State
let studentData = {
  name: "",
  surname: "",
  group: "",
  entryTime: null,
};

let currentUnit = null;
let currentCardIndex = 0;
let cardShuffled = [];
let currentExerciseType = "";
let currentQuestion = 0;
let exerciseQuestions = [];
let exerciseTimer = null;
let exerciseScore = { correct: 0, wrong: 0 };
let fontSize = 18;
let selectedTestSize = 50;
let isGrandTest = false;

// Units data
const unitsData = [
  {
    id: 1,
    title: "The Best Recruiting Agents",
    text: 'In 1849 a servant girl wrote home to her brother from Port Adelaide, South Australia: “I have accepted a situation at £20 per annum, so you can tell the servants in your neighbourhood not to stay in England for such wages as from £4 to £8 a year, but come here.” Letters such as these, which were circulated from kitchen to kitchen and from attic to attic in English homes, were the best recruiting agents for the colonies, which were then so desperately in need of young women to serve the pioneers who were trying to create a new life for themselves in their chosen countries. Other girls read about the much better prospects overseas in newspapers and magazines, which also published advertisements giving details of free or assisted passages.',
    words: [
      {
        word: "situation",
        definition: "job (in the passage, as a servant)",
        translation: "ish o‘rni (matnda xizmatkorlik ishi ma’nosida)",
      },
      {
        word: "per annum",
        definition: "for each year",
        translation: "har yil uchun",
      },
      {
        word: "wages",
        definition:
          "money paid for work, especially unskilled work",
        translation: "ish haqi (oddiy ishlarda)",
      },
      {
        word: "circulate",
        definition:
          "to move from place to place or person to person; to pass around",
        translation: "aylanmoq, qo‘ldan qo‘lga o‘tmoq",
      },
      {
        word: "attic",
        definition:
          "a room at the top of a house just below the roof",
        translation: "cherdak",
      },
      {
        word: "recruiting",
        definition: "the process of finding new workers",
        translation: "yollash, ishchilarni jalb qilish",
      },
      {
        word: "desperately",
        definition: "very greatly or seriously",
        translation: "juda jiddiy, keskin tarzda",
      },
      {
        word: "pioneer",
        definition:
          "one of the first people to move to a new country to work or settle",
        translation: "birinchi ko‘chib borgan odam, poydevor qo‘yuvchi",
      },
      {
        word: "prospects",
        definition:
          "chances of success, especially in work",
        translation: "muvaffaqiyat imkoniyatlari, istiqbollar (ishda)",
      },
      {
        word: "overseas",
        definition:
          "abroad; in a foreign country across the sea",
        translation: "dengiz ortidagi mamlakatlar, chet el",
      },
      {
        word: "free",
        definition: "without payment; costing nothing",
        translation: "bepul, tekin",
      },
      {
        word: "assisted",
        definition:
          "helped financially, especially for travel costs",
        translation: "moliyaviy yordam ko‘rsatilgan",
      },
      {
        word: "passage",
        definition:
          "a journey by ship from one place to another",
        translation: "dengiz orqali safar",
      },
    ],
  },
  {
    id: 2,
    title: "Bringing Back Lost Memories",
    text: "Our unconscious mind contains many millions of past experiences that appear to be lost forever. However, several psychological techniques can bring back forgotten memories. One method is free association, used by psychiatrists. When a patient allows their mind to wander at will, it may reveal clues to forgotten events which, if carefully explored, can uncover entire networks of hidden ideas and past fears. Certain drugs and hypnotism can also help access the unconscious mind.",
    words: [
      {
        word: "forever",
        definition: "for all time",
        translation: "umrbod",
      },
      {
        word: "device",
        definition:
          "method for doing something or achieving a result",
        translation: "usul, metod",
      },
      {
        word: "wander",
        definition:
          "let your thoughts move without focus",
        translation: "daydib yurmoq",
      },
      {
        word: "at will",
        definition: "whenever and as much as you want",
        translation: "istagancha",
      },
      {
        word: "clue",
        definition:
          "information that helps solve a problem",
        translation: "kalit, jumboq yechimi",
      },
      {
        word: "pursue",
        definition: "try to learn more through questioning",
        translation: "kuzatmoq",
      },
      {
        word: "network",
        definition:
          "a connected system of many things",
        translation: "tizim",
      },
      {
        word: "terror",
        definition:
          "something that causes great fear",
        translation: "daxshat, qo‘rquv",
      },
      {
        word: "tremendous",
        definition: "very great or important",
        translation: "ulkan miqyosdagi",
      },
    ],
  },
  {
    id: 3,
    title: "Palm Trees",
    text: "Among the more than 2,500 species of palm trees worldwide, the Palmyra palm is second only to the coconut palm in importance. It provides food and over a hundred useful end-products. To obtain most of its benefits, the tree must be climbed twice daily to extract nutritious juice from its flower-bunches. This juice, converted through various methods, forms the basis of many products. However, collecting it is arduous and often dangerous, as the trees can reach heights of over 30 meters.",
    words: [
      {
        word: "plus",
        definition: "more than",
        translation: "…dan ko‘p",
      },
      {
        word: "yield",
        definition: "produce naturally",
        translation: "hosil bermoq",
      },
      {
        word: "end-product",
        definition: "final product after processing",
        translation: "tayyor mahsulot",
      },
      {
        word: "obtain",
        definition: "to get",
        translation: "ega bo‘lmoq",
      },
      {
        word: "majority",
        definition: "more than half",
        translation: "asosiy, ko‘pchilik",
      },
      {
        word: "benefit",
        definition: "something useful or good",
        translation: "foyda",
      },
      {
        word: "extract",
        definition: "to take out from something",
        translation: "ajratib olmoq",
      },
      {
        word: "nutritious",
        definition: "having high food value",
        translation: "o‘zuqaviy, to‘yimli",
      },
      {
        word: "convert",
        definition: "to change in form",
        translation: "o‘zgartirmoq",
      },
      {
        word: "arduous",
        definition: "requiring a lot of effort",
        translation: "qiyin, mehnat talab",
      },
      {
        word: "top",
        definition: "to be higher than",
        translation: "…dan balandroq bo‘lmoq",
      },
    ],
  },
  {
    id: 4,
    title: "Overreacting to a Joke",
    text: "People who laugh the longest and loudest at retold jokes often do not have a strong sense of humour. Though they may not admit it, they vaguely feel this weakness and sometimes go to extremes to hide it. A mediocre joke may get the same reaction from them as a genuinely funny one. Psychological research shows that people with a genuinely keen sense of humour do not laugh excessively. They appreciate humour deeply but remain discriminating and never overreact.",
    words: [
      {
        word: "habitually",
        definition:
          "usually; according to someone's normal behaviour",
        translation: "odatdagidek",
      },
      {
        word: "retell",
        definition: "to repeat a story",
        translation: "qayta aytmoq",
      },
      {
        word: "possess",
        definition: "to have or own",
        translation: "egalik qilmoq",
      },
      {
        word: "particularly",
        definition: "especially; noticeably",
        translation: "ayniqsa, sezilarli",
      },
      {
        word: "keen",
        definition: "strong, sharp, highly aware",
        translation: "kuchli, sezgir",
      },
      {
        word: "sense of humour",
        definition: "ability to see when something is funny",
        translation: "kulgi hissi",
      },
      {
        word: "vaguely",
        definition: "not clearly",
        translation: "noaniq",
      },
      {
        word: "deficiency",
        definition: "lack of something",
        translation: "kamchilik",
      },
      {
        word: "frequently",
        definition: "often",
        translation: "tez-tez",
      },
      {
        word: "go to extremes",
        definition: "do more than acceptable",
        translation: "oshirib yubormoq",
      },
      {
        word: "mediocre",
        definition: "not very good",
        translation: "o‘rtacha",
      },
      {
        word: "likely",
        definition: "probable",
        translation: "ehtimol",
      },
      {
        word: "get a rise out of",
        definition: "cause a reaction",
        translation: "reaksiya chaqirmoq",
      },
      {
        word: "likewise",
        definition: "in a similar way",
        translation: "shuningdek",
      },
      {
        word: "be prone",
        definition: "likely to do something",
        translation: "moyil bo‘lmoq",
      },
      {
        word: "appreciative",
        definition:
          "showing enjoyment or understanding",
        translation: "qadrlovchi",
      },
      {
        word: "discriminating",
        definition:
          "able to judge quality well",
        translation: "farqlay oladigan",
      },
    ],
  },
  {
    id: 5,
    title: "Alpine Forests",
    text: "Alpine forests act as lifeguards for the snowy mountain peaks of the Alps. They naturally protect against avalanches and landslides. However, the expanding skiing industry, while beneficial for poor Alpine farmers, is harming the environment. Trees have been felled to make space for ski runs, car parks, and hotels. Meadows have been abandoned as farmers focus on tourism. As a result, avalanches have become more common. Experts estimate that two-thirds of the avalanches reaching inhabited areas each year are caused by forest depletion.",
    words: [
      {
        word: "lifeguard",
        definition:
          "a person who protects others from danger in water",
        translation: "qutqaruvchi",
      },
      {
        word: "peak",
        definition: "top of a mountain",
        translation: "cho‘qqi",
      },
      {
        word: "barrier",
        definition: "something that blocks movement",
        translation: "to‘siq",
      },
      {
        word: "avalanche",
        definition:
          "mass of snow sliding down a mountain",
        translation: "qor ko‘chkisi",
      },
      {
        word: "landslide",
        definition:
          "movement of rocks and soil downward",
        translation: "yer ko‘chkisi",
      },
      {
        word: "boon",
        definition: "something helpful",
        translation: "naf, foyda",
      },
      {
        word: "fell",
        definition: "cut down trees",
        translation: "kesmoq",
      },
      {
        word: "meadow",
        definition: "grassland",
        translation: "maysazor",
      },
      {
        word: "abandon",
        definition: "leave behind",
        translation: "tashlab ketmoq",
      },
      {
        word: "keen",
        definition: "eager",
        translation: "mukkasidan ketmoq",
      },
      {
        word: "exploit",
        definition: "use for profit",
        translation: "foydalanmoq",
      },
      {
        word: "phenomenon",
        definition: "observable event",
        translation: "hodisa",
      },
      {
        word: "estimate",
        definition: "calculate roughly",
        translation: "chamalamoq",
      },
      {
        word: "descend",
        definition: "move downward",
        translation: "pastga tushmoq",
      },
      {
        word: "inhabited",
        definition: "with people living there",
        translation: "aholi yashaydigan",
      },
      {
        word: "depletion",
        definition:
          "reduction; running out",
        translation: "kamayish",
      },
    ],
  },
];

// Init
window.onload = function () {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  loadSavedData();
  renderUnits();

  if ("speechSynthesis" in window) {
    loadVoices();
  } else {
    const selector = document.getElementById("voiceSelector");
    if (selector) {
      selector.innerHTML = '<option value="">Not supported</option>';
      selector.disabled = true;
    }
  }

  // Prevent Enter key from acting as submit, and manually trigger enterApp
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement.closest("#welcomeInputs")) {
      e.preventDefault();
      enterApp();
    }
  });
};

// Load saved student data
function loadSavedData() {
  const savedName = localStorage.getItem("elsName");
  const savedSurname = localStorage.getItem("elsSurname");
  if (savedName) document.getElementById("nameInput").value = savedName;
  if (savedSurname) document.getElementById("surnameInput").value = savedSurname;
}

// Date & time
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  document.getElementById("datetimeDisplay").textContent =
    now.toLocaleDateString("en-US", options);
}

// Enter app
function enterApp() {
  const name = document.getElementById("nameInput").value.trim();
  const surname = document.getElementById("surnameInput").value.trim();
  const group = document.getElementById("groupInput").value.trim();

  if (!name || !surname || !group) {
    alert("Please fill all fields");
    return;
  }

  studentData.name = name;
  studentData.surname = surname;
  studentData.group = group;
  studentData.entryTime = new Date();

  localStorage.setItem("elsName", name);
  localStorage.setItem("elsSurname", surname);

  document.getElementById("welcomePage").classList.add("hidden");
  document.getElementById("mainPage").classList.remove("hidden");
  document.getElementById("globalHeader").classList.remove("hidden");
}

// Render units
function renderUnits() {
  const grid = document.getElementById("unitsGrid");
  grid.innerHTML = "";

  unitsData.forEach((unit) => {
    const completed = isUnitCompleted(unit.id);
    const progress = getUnitProgress(unit.id);

    const card = document.createElement("div");
    card.className = `unit-card ${completed ? "completed" : ""}`;
    card.onclick = () => openUnit(unit.id);

    card.innerHTML = `
      <div class="unit-number">Unit ${unit.id}</div>
      <div class="unit-title">${unit.title}</div>
      <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Filter units
function filterUnits() {
  const search = document.getElementById("searchBar").value.toLowerCase();
  const cards = document.querySelectorAll(".unit-card");

  cards.forEach((card) => {
    const title = card
      .querySelector(".unit-title")
      .textContent.toLowerCase();
    card.style.display = title.includes(search) ? "block" : "none";
  });
}

// Progress helpers
function isUnitCompleted(unitId) {
  const completed = localStorage.getItem(`unit_${unitId}_completed`);
  return completed === "true";
}

function getUnitProgress(unitId) {
  const progress = localStorage.getItem(`unit_${unitId}_progress`);
  return progress ? parseInt(progress, 10) : 0;
}

// Open unit
function openUnit(unitId) {
  currentUnit = unitsData.find((u) => u.id === unitId);
  if (!currentUnit) return;

  document.getElementById("mainPage").classList.add("hidden");
  document.getElementById("unitPage").classList.remove("hidden");
  document.getElementById("unitPageTitle").textContent = `Unit ${currentUnit.id}: ${currentUnit.title}`;
  document.getElementById("textContent").textContent = currentUnit.text;

  cardShuffled = [...currentUnit.words].sort(() => Math.random() - 0.5);
  currentCardIndex = 0;
  showCard();

  document.getElementById("cardsCompleteButtons").classList.add("hidden");
}

// Back to main page
function showMainPage() {
  sendIncompleteIfNeeded("Returned to main page");
  document.getElementById("unitPage").classList.add("hidden");
  document.getElementById("exercisePage").classList.add("hidden");
  document.getElementById("resultsPage").classList.add("hidden");
  document.getElementById("grandTestSetup").classList.add("hidden");
  document.getElementById("mainPage").classList.remove("hidden");
  renderUnits();
}

// Reading
function readText() {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-speech not supported in your browser");
    return;
  }
  if (!currentUnit) return;
  const text = `${currentUnit.title}. ${currentUnit.text}`;
  const utterance = createUtterance(text, 0.9);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function changeFontSize(delta) {
  fontSize += delta * 2;
  fontSize = Math.max(14, Math.min(28, fontSize));
  document.getElementById("textContent").style.fontSize = `${fontSize}px`;
}

// Flashcards
function showCard() {
  if (currentCardIndex >= cardShuffled.length) {
    document
      .getElementById("cardsCompleteButtons")
      .classList.remove("hidden");
    createFireworks();
    return;
  }

  const word = cardShuffled[currentCardIndex];
  document.getElementById("cardWord").textContent = word.word;
  document.getElementById("cardDefinition").textContent = word.definition;
  document.getElementById("cardTranslation").textContent = word.translation;
  document.getElementById("cardProgress").textContent = `Card ${
    currentCardIndex + 1
  } / ${cardShuffled.length}`;
  document.getElementById("flipCard").classList.remove("flipped");
}

function flipCard() {
  document.getElementById("flipCard").classList.toggle("flipped");
}

function nextCard() {
  currentCardIndex++;
  showCard();
}

function previousCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    showCard();
  }
}

function resetCards() {
  cardShuffled = [...currentUnit.words].sort(() => Math.random() - 0.5);
  currentCardIndex = 0;
  showCard();
  document.getElementById("cardsCompleteButtons").classList.add("hidden");
}

function speakWord(event) {
  event.stopPropagation();
  if (!("speechSynthesis" in window)) {
    alert("Text-to-speech not supported in your browser");
    return;
  }
  if (!cardShuffled.length) return;
  const word = cardShuffled[currentCardIndex].word;
  const utterance = createUtterance(word, 0.95);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// Exercises
function startUnitExercises() {
  const el = document.getElementById("exerciseSection");
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth" });
}

function backToUnit() {
  if (exerciseTimer) clearInterval(exerciseTimer);
  sendIncompleteIfNeeded("Returned to unit page");
  document.getElementById("exercisePage").classList.add("hidden");
  document.getElementById("unitPage").classList.remove("hidden");
}

function startExercise(type) {
  currentExerciseType = type;
  isGrandTest = false;
  const count = currentUnit.words.length;
  generateExerciseQuestions(currentUnit.words, type, count);
  showCountdown(() => {
    document.getElementById("unitPage").classList.add("hidden");
    document.getElementById("exercisePage").classList.remove("hidden");
    startExerciseTest();
  });
}

function generateExerciseQuestions(words, type, count) {
  exerciseQuestions = [];
  exerciseScore = { correct: 0, wrong: 0 };

  const pool = [...words]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, words.length));

  pool.forEach((correctWord) => {
    const wrongPool = words.filter((w) => w !== correctWord);
    const wrongWords = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3);
    const optionsCandidates = [correctWord, ...wrongWords].sort(
      () => Math.random() - 0.5
    );

    let question = {};
    switch (type) {
      case "definition":
        question = {
          text: correctWord.word,
          options: optionsCandidates.map((w) => w.definition),
          correct: correctWord.definition,
          type: "Matching Definition",
        };
        break;
      case "engToUz":
        question = {
          text: correctWord.word,
          options: optionsCandidates.map((w) => w.translation),
          correct: correctWord.translation,
          type: "English → Uzbek",
        };
        break;
      case "uzToEng":
        question = {
          text: correctWord.translation,
          options: optionsCandidates.map((w) => w.word),
          correct: correctWord.word,
          type: "Uzbek → English",
        };
        break;
      case "gapfill":
        const sentence = `The concept of ${correctWord.word} is important in modern society.`;
        question = {
          text: sentence.replace(correctWord.word, "______"),
          options: optionsCandidates.map((w) => w.word),
          correct: correctWord.word,
          type: "Gap-Filling",
        };
        break;
      default:
        break;
    }
    exerciseQuestions.push(question);
  });

  exerciseQuestions.sort(() => Math.random() - 0.5);
}

function startExerciseTest() {
  currentQuestion = 0;
  questionAnswered = false;
  exerciseSessionActive = true;
  exerciseStatusSent = false;
  showQuestion();
}

function resetQuestionUI() {
  questionAnswered = false;
  const feedbackEl = document.getElementById("answerFeedback");
  if (feedbackEl) {
    feedbackEl.classList.add("hidden");
    feedbackEl.textContent = "";
  }
  const nextBtn = document.getElementById("nextQuestionBtn");
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.textContent =
      currentQuestion === exerciseQuestions.length - 1
        ? "See Results"
        : "Next Question";
  }
}

function displayAnswerFeedback(isCorrect, correctAnswer, reason = "") {
  const feedbackEl = document.getElementById("answerFeedback");
  if (!feedbackEl) return;
  feedbackEl.classList.remove("hidden");
  feedbackEl.style.color = isCorrect ? "var(--success)" : "var(--error)";
  if (isCorrect) {
    feedbackEl.textContent = "✅ Correct! Keep going.";
  } else {
    const reasonText = reason ? `${reason}. ` : "";
    feedbackEl.textContent = `❌ ${reasonText}Correct answer: ${correctAnswer}`;
  }
}

function lockOptionButtons(correctAnswer, selectedBtn = null, isCorrect = false) {
  const allButtons = document.querySelectorAll(".option-btn");
  allButtons.forEach((button) => {
    button.style.pointerEvents = "none";
    if (button.dataset.value === correctAnswer) {
      button.classList.add("correct");
    } else if (button === selectedBtn && !isCorrect) {
      button.classList.add("incorrect");
    }
  });
}

function enableNextButton() {
  const nextBtn = document.getElementById("nextQuestionBtn");
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.textContent =
      currentQuestion === exerciseQuestions.length - 1
        ? "See Results"
        : "Next Question";
  }
}

function goToNextQuestion() {
  if (!questionAnswered) return;
  currentQuestion++;
  showQuestion();
}

function getAnsweredCount() {
  if (!exerciseQuestions.length) return 0;
  return currentQuestion + (questionAnswered ? 1 : 0);
}

function sendIncompleteIfNeeded(reason = "") {
  if (!exerciseSessionActive || exerciseStatusSent || !exerciseQuestions.length)
    return;
  const total = exerciseQuestions.length;
  const answered = getAnsweredCount();
  const percentage = total
    ? Math.round((exerciseScore.correct / total) * 100)
    : 0;
  let extra = `Answered: ${answered}/${total}\n✅ Correct: ${exerciseScore.correct}\n❌ Wrong: ${exerciseScore.wrong}`;
  if (reason) {
    extra += `\nNote: ${reason}`;
  }
  sendResultToTelegram(percentage, total, "Incomplete", extra);
  exerciseStatusSent = true;
  exerciseSessionActive = false;
  questionAnswered = false;
}

function showQuestion() {
  if (currentQuestion >= exerciseQuestions.length) {
    showResults();
    return;
  }

  const question = exerciseQuestions[currentQuestion];
  resetQuestionUI();
  const progress = ((currentQuestion + 1) / exerciseQuestions.length) * 100;

  document.getElementById(
    "questionCounter"
  ).textContent = `Question ${currentQuestion + 1} / ${
    exerciseQuestions.length
  }`;
  document.getElementById("exerciseProgress").style.width = `${progress}%`;
  document.getElementById("questionText").textContent = question.text;

  const optionsContainer = document.getElementById("optionsContainer");
  optionsContainer.innerHTML = "";

  question.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = option;
    btn.dataset.value = option;
    btn.onclick = () => checkAnswer(option, question.correct, btn);
    optionsContainer.appendChild(btn);
  });

  startTimer(question);
}

// Timer
function startTimer(question) {
  let timeLeft = 30;
  const timerEl = document.getElementById("timer");
  timerEl.textContent = `${timeLeft}s`;
  timerEl.classList.remove("warning");

  if (exerciseTimer) clearInterval(exerciseTimer);

  exerciseTimer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `${timeLeft}s`;

    if (timeLeft <= 10) {
      timerEl.classList.add("warning");
    }

    if (timeLeft <= 0) {
      clearInterval(exerciseTimer);
      if (!questionAnswered) {
        questionAnswered = true;
        exerciseScore.wrong++;
        lockOptionButtons(question.correct);
        displayAnswerFeedback(false, question.correct, "Time is up");
        enableNextButton();
      }
    }
  }, 1000);
}

// Check answer
function checkAnswer(selected, correct, btn) {
  if (questionAnswered) return;
  clearInterval(exerciseTimer);
  questionAnswered = true;
  const isCorrect = selected === correct;
  if (isCorrect) {
    exerciseScore.correct++;
  } else {
    exerciseScore.wrong++;
  }
  lockOptionButtons(correct, btn, isCorrect);
  displayAnswerFeedback(isCorrect, correct);
  enableNextButton();
}

// Results
function showResults() {
  const total = exerciseQuestions.length;
  const percentage = Math.round((exerciseScore.correct / total) * 100);
  if (exerciseTimer) clearInterval(exerciseTimer);
  exerciseSessionActive = false;
  exerciseStatusSent = true;
  questionAnswered = false;

  document.getElementById("exercisePage").classList.add("hidden");
  document.getElementById("resultsPage").classList.remove("hidden");

  document.getElementById(
    "scoreDisplay"
  ).textContent = `${exerciseScore.correct}/${total} (${percentage}%)`;
  document.getElementById("totalQuestions").textContent = total;
  document.getElementById("correctAnswers").textContent =
    exerciseScore.correct;
  document.getElementById("wrongAnswers").textContent = exerciseScore.wrong;

  if (percentage >= 70) {
    createFireworks();
  }

  if (!isGrandTest && currentUnit) {
    localStorage.setItem(`unit_${currentUnit.id}_completed`, "true");
    localStorage.setItem(`unit_${currentUnit.id}_progress`, "100");
  }

  sendResultToTelegram(percentage, total, "Completed");
}

function retakeTest() {
  if (isGrandTest) {
    document.getElementById("resultsPage").classList.add("hidden");
    document.getElementById("grandTestSetup").classList.remove("hidden");
  } else {
    const count = currentUnit.words.length;
    generateExerciseQuestions(currentUnit.words, currentExerciseType, count);
    showCountdown(() => {
      document.getElementById("resultsPage").classList.add("hidden");
      document.getElementById("exercisePage").classList.remove("hidden");
      startExerciseTest();
    });
  }
}

function backToUnitFromResults() {
  document.getElementById("resultsPage").classList.add("hidden");
  document.getElementById("unitPage").classList.remove("hidden");
}

// Countdown overlay
function showCountdown(callback) {
  const overlay = document.createElement("div");
  overlay.className = "countdown-overlay";
  document.body.appendChild(overlay);

  let count = 3;
  const numberEl = document.createElement("div");
  numberEl.className = "countdown-number";
  numberEl.textContent = count;
  overlay.appendChild(numberEl);

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      numberEl.textContent = count;
      numberEl.style.animation = "none";
      setTimeout(() => {
        numberEl.style.animation = "countdownAnim 1s ease-out";
      }, 10);
    } else {
      numberEl.textContent = "Go!";
      numberEl.style.animation = "none";
      setTimeout(() => {
        numberEl.style.animation = "countdownAnim 1s ease-out";
      }, 10);
      clearInterval(interval);
      setTimeout(() => {
        document.body.removeChild(overlay);
        callback();
      }, 1000);
    }
  }, 1000);
}

// Fireworks
function createFireworks() {
  const container = document.createElement("div");
  container.className = "fireworks";
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.5;

      for (let j = 0; j < 30; j++) {
        const particle = document.createElement("div");
        particle.className = "firework";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.background = `hsl(${
          Math.random() * 360
        }, 100%, 50%)`;

        const angle = (Math.PI * 2 * j) / 30;
        const velocity = 50 + Math.random() * 100;
        particle.style.setProperty(
          "--tx",
          `${Math.cos(angle) * velocity}px`
        );
        particle.style.setProperty(
          "--ty",
          `${Math.sin(angle) * velocity}px`
        );

        container.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
      }
    }, i * 200);
  }

  setTimeout(() => container.remove(), 10000);
}

// Grand Test
function startGrandTest() {
  document.getElementById("mainPage").classList.add("hidden");
  document.getElementById("grandTestSetup").classList.remove("hidden");
}

function selectTestSize(e, size) {
  selectedTestSize = size;
  document
    .querySelectorAll(".size-option")
    .forEach((el) => el.classList.remove("selected"));
  if (e && e.currentTarget) {
    e.currentTarget.classList.add("selected");
  }
}

function beginGrandTest() {
  isGrandTest = true;

  const allWords = [];
  unitsData.forEach((unit) => {
    allWords.push(...unit.words);
  });

  const questionsPerType = Math.floor(selectedTestSize / 4);
  exerciseQuestions = [];
  exerciseScore = { correct: 0, wrong: 0 };

  const types = ["definition", "engToUz", "uzToEng", "gapfill"];

  types.forEach((type) => {
    const shuffled = [...allWords]
      .sort(() => Math.random() - 0.5)
      .slice(0, questionsPerType);

    shuffled.forEach((correctWord) => {
      const wrongPool = allWords.filter((w) => w !== correctWord);
      const wrongWords = wrongPool
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const optionsCandidates = [correctWord, ...wrongWords].sort(
        () => Math.random() - 0.5
      );

      let question = {};
      switch (type) {
        case "definition":
          question = {
            text: correctWord.word,
            options: optionsCandidates.map((w) => w.definition),
            correct: correctWord.definition,
            type: "Matching Definition",
          };
          break;
        case "engToUz":
          question = {
            text: correctWord.word,
            options: optionsCandidates.map((w) => w.translation),
            correct: correctWord.translation,
            type: "English → Uzbek",
          };
          break;
        case "uzToEng":
          question = {
            text: correctWord.translation,
            options: optionsCandidates.map((w) => w.word),
            correct: correctWord.word,
            type: "Uzbek → English",
          };
          break;
        case "gapfill":
          const sentence = `The concept of ${correctWord.word} is important in modern society.`;
          question = {
            text: sentence.replace(correctWord.word, "______"),
            options: optionsCandidates.map((w) => w.word),
            correct: correctWord.word,
            type: "Gap-Filling",
          };
          break;
        default:
          break;
      }
      exerciseQuestions.push(question);
    });
  });

  exerciseQuestions.sort(() => Math.random() - 0.5);

  showCountdown(() => {
    document.getElementById("grandTestSetup").classList.add("hidden");
    document.getElementById("exercisePage").classList.remove("hidden");
    startExerciseTest();
  });
}

// Send result to backend which sends to Telegram
async function sendResultToTelegram(
  percentage,
  total,
  status,
  extraDetails = ""
) {
  try {
    const payload = {
      percentage: isNaN(percentage) ? 0 : percentage,
      total,
      status,
      extraDetails,
      isGrandTest,
      selectedTestSize,
      unit: currentUnit ? { id: currentUnit.id, title: currentUnit.title } : null,
      studentData,
      score: exerciseScore,
    };

    await fetch("/api/sendResult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send result to backend:", error);
  }
}

// Incomplete test notification when closing tab
window.addEventListener("beforeunload", function () {
  sendIncompleteIfNeeded("Browser closed during exercise");
});

// Theme switching
function cycleTheme() {
  const themes = ["light", "soft-blue", "dark"];
  const current = document.body.getAttribute("data-theme") || "light";
  const currentIndex = themes.indexOf(current);
  const nextIndex = (currentIndex + 1) % themes.length;
  document.body.setAttribute("data-theme", themes[nextIndex]);
}

// Progress dashboard
function showProgress() {
  let html = '<h3>📊 Your Progress</h3><div style="margin-top: 20px;">';

  unitsData.forEach((unit) => {
    const completed = isUnitCompleted(unit.id);
    const progress = getUnitProgress(unit.id);
    let status = "Not started";
    if (completed) status = "Completed";
    else if (progress > 0) status = "In progress";

    html += `
      <div style="padding: 15px; margin-bottom: 10px; background: var(--secondary-bg); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>Unit ${unit.id}:</strong> ${unit.title}</span>
        <span style="color: ${
          completed ? "var(--success)" : "var(--warning)"
        };">${status}</span>
      </div>
    `;
  });

  html += "</div>";
  showModal(html);
}

// Modal
function showModal(content) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close" onclick="this.closest('.modal').remove()">×</span>
      ${content}
    </div>
  `;
  document.body.appendChild(modal);
}
