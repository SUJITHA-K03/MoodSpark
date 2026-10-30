
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://dummyjson.com/quotes?limit=0";

const emotionData = {
  Happy: {
    emoji: "😊",
    words: [
      "happy", "happiness", "smile", "joy", "love",
      "laugh", "beautiful", "positive", "hope", "life"
    ],
  },
  Sad: {
    emoji: "😢",
    words: [
      "sad", "pain", "tears", "dark", "difficult",
      "hope", "healing", "heart", "suffer", "strength"
    ],
  },
  Angry: {
    emoji: "😡",
    words: [
      "anger", "angry", "peace", "calm", "patience",
      "control", "mind", "forgive", "power", "quiet"
    ],
  },
  Motivated: {
    emoji: "💪",
    words: [
      "success", "work", "dream", "achieve", "goal",
      "effort", "great", "start", "believe", "try"
    ],
  },
};

const emotionKeywords = {
  Happy: [
    "happy", "happiness", "joy", "excited", "great",
    "wonderful", "good", "smile", "love", "glad"
  ],
  Sad: [
    "sad", "upset", "lonely", "cry", "depressed",
    "hurt", "heartbroken", "unhappy", "hopeless"
  ],
  Angry: [
    "angry", "anger", "furious", "mad", "irritated",
    "annoyed", "frustrated", "rage"
  ],
  Motivated: [
    "motivated", "determined", "ambitious", "focused",
    "productive", "goal", "success", "confident", "ready"
  ],
};

const fallbackQuotes = {
  Happy: {
    quote: "The purpose of our lives is to be happy.",
    author: "Dalai Lama",
  },
  Sad: {
    quote: "Even the darkest night will end and the sun will rise.",
    author: "Victor Hugo",
  },
  Angry: {
    quote: "Nothing can bring you peace but yourself.",
    author: "Ralph Waldo Emerson",
  },
  Motivated: {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
};

function detectEmotion(message) {
  const words = message.toLowerCase().match(/[a-z]+/g) || [];

  const scores = Object.fromEntries(
    Object.entries(emotionKeywords).map(([emotion, keywords]) => [
      emotion,
      words.filter((word) => keywords.includes(word)).length,
    ])
  );

  const maxScore = Math.max(...Object.values(scores));

  if (maxScore === 0) return null;

  const matches = Object.keys(scores).filter(
    (emotion) => scores[emotion] === maxScore
  );

  return matches.length === 1 ? matches[0] : null;
}

function App() {
  const [allQuotes, setAllQuotes] = useState([]);
  const [emotion, setEmotion] = useState("Happy");
  const [quote, setQuote] = useState(fallbackQuotes.Happy);
  const [message, setMessage] = useState("");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("emotionFavorites") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detected, setDetected] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  // 1. Fetch quotes from external API
  useEffect(() => {
    let active = true;

    async function fetchQuotes() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to load quotes");
        }

        const data = await response.json();

        if (active) {
          setAllQuotes(data.quotes || []);
        }
      } catch {
        if (active) {
          setError("API can't load . So use Sample quote .");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchQuotes();

    return () => {
      active = false;
    };
  }, []);

  // 2. Save favorites whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "emotionFavorites",
        JSON.stringify(favorites)
      );
    } catch {
      // Storage may be unavailable in some browser settings
    }
  }, [favorites]);

  // 3. Find a quote that approximately matches the emotion
  const getQuote = (selectedEmotion) => {
    const keywords = emotionData[selectedEmotion].words;

    const matchingQuotes = allQuotes.filter((item) => {
      const text = item.quote.toLowerCase();

      return keywords.some((word) =>
        text.includes(word)
      );
    });

    const pool =
      matchingQuotes.length > 0
        ? matchingQuotes
        : allQuotes;

    if (pool.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * pool.length
      );

      setQuote(pool[randomIndex]);
    } else {
      setQuote(fallbackQuotes[selectedEmotion]);
    }

    setShowFavorites(false);
  };

  // 4. Detect emotion from user text
  const handleDetectEmotion = () => {
    const detectedEmotion = detectEmotion(message);

    if (!detectedEmotion) {
      setDetected(false);
      setError(
        "Emotion can't be detected. Try Happy, sad, angry or motivated words ."
      );
      return;
    }

    setError("");
    setDetected(true);
    setEmotion(detectedEmotion);
    getQuote(detectedEmotion);
  };

  const handleEmotionClick = (selectedEmotion) => {
    setEmotion(selectedEmotion);
    setDetected(false);
    setError("");
    getQuote(selectedEmotion);
  };

  // 5. Add or remove favorites
  const isFavorite = favorites.some(
    (item) => item.quote === quote.quote
  );

  const toggleFavorite = () => {
    setFavorites((previous) => {
      const exists = previous.some(
        (item) => item.quote === quote.quote
      );

      if (exists) {
        return previous.filter(
          (item) => item.quote !== quote.quote
        );
      }

      return [
        ...previous,
        {
          ...quote,
          id: quote.id ?? quote.quote,
          emotion,
        },
      ];
    });
  };

  const removeFavorite = (quoteToRemove) => {
    setFavorites((previous) =>
      previous.filter(
        (item) => item.quote !== quoteToRemove
      )
    );
  };

  return (
    <main className={`app theme-${emotion.toLowerCase()}`}>
      <section className="quote-card">
        <h1>Emotion Quote Generator</h1>

        <p className="subtitle">
          Understand your feelings. Find your words.
        </p>

        <div className="input-section">
          <label htmlFor="feeling">
            How are you feeling today?
          </label>

          <textarea
            id="feeling"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
              setDetected(false);
            }}
            placeholder="Example: I feel sad and lonely today..."
            rows={3}
          />

          <button
            className="detect-btn"
            onClick={handleDetectEmotion}
            disabled={!message.trim()}
          >
            Detect My Emotion
          </button>

          {detected && (
            <p className="detected-message">
              Detected: {emotionData[emotion].emoji} {emotion}
            </p>
          )}
        </div>

        <p className="section-label">Or select your emotion</p>

        <div className="emotion-list">
          {Object.entries(emotionData).map(
            ([name, data]) => (
              <button
                key={name}
                className={`emotion-btn ${
                  emotion === name ? "active" : ""
                }`}
                onClick={() => handleEmotionClick(name)}
              >
                {data.emoji} {name}
              </button>
            )
          )}
        </div>

        <div className="quote-area">
          {loading ? (
            <p>Loading quotes...</p>
          ) : (
            <>
              <div className="quote-mark">“</div>

              <p className="quote-text">{quote.quote}</p>

              <p className="quote-author">
                — {quote.author}
              </p>
            </>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="action-buttons">
          <button
            className="primary-btn"
            onClick={() => getQuote(emotion)}
            disabled={loading}
          >
            New Quote ↻
          </button>

          <button
            className={`favorite-btn ${
              isFavorite ? "saved" : ""
            }`}
            onClick={toggleFavorite}
            aria-label={
              isFavorite ? "Remove favorite" : "Add favorite"
            }
          >
            {isFavorite ? "♥ Saved" : "♡ Favorite"}
          </button>
        </div>

        <button
          className="show-favorites-btn"
          onClick={() => setShowFavorites(!showFavorites)}
        >
          {showFavorites ? "Hide Favorites" : "♥ My Favorites"} (
          {favorites.length})
        </button>

        {showFavorites && (
          <div className="favorites-section">
            <h2>My Favorite Quotes</h2>

            {favorites.length === 0 ? (
              <p>No favorites yet. Save a quote you love!</p>
            ) : (
              favorites.map((item) => (
                <article
                  className="favorite-item"
                  key={item.quote}
                >
                  <p>“{item.quote}”</p>
                  <p className="quote-author">
                    — {item.author}
                  </p>
                  <button
                    className="remove-btn"
                    onClick={() => removeFavorite(item.quote)}
                  >
                    Remove
                  </button>
                </article>
              ))
            )}
          </div>
        )}

        <p className="footer-note">
          Your feelings matter. Take a moment for yourself.
        </p>
      </section>
    </main>
  );
}

export default App;
