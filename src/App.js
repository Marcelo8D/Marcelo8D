import React, { useState, useEffect } from 'react';

// Helper function to decode HTML entities
const decodeHtml = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

// Transform API data to match our component structure
const transformApiData = (apiQuestions) => {
  return apiQuestions.map((q, index) => ({
    id: index + 1,
    question: decodeHtml(q.question),
    options: [
      decodeHtml(q.correct_answer),
      ...q.incorrect_answers.map(ans => decodeHtml(ans))
    ].sort(() => Math.random() - 0.5), // Shuffle options
    correctAnswer: 0
  })).map(q => {
    // Find the correct answer index after shuffling
    const correctAnswerText = decodeHtml(apiQuestions[q.id - 1].correct_answer);
    const correctIndex = q.options.findIndex(option => option === correctAnswerText);
    return {
      ...q,
      correctAnswer: correctIndex
    };
  });
};

// Question Component - displays a single question with options
function Question({ question, onAnswer, selectedAnswer, timeLeft, onTimeUp }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Timer Display */}
      <div className="flex justify-between items-center mb-4">
        <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
          ⏰ {timeLeft}s
        </div>
        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-lg font-bold ${
          timeLeft <= 5 ? 'border-red-500 text-red-500' : 'border-blue-500 text-blue-500'
        }`}>
          {timeLeft}
        </div>
      </div>
      
      {/* Progress Ring */}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-300"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={timeLeft <= 5 ? "text-red-500" : "text-blue-500"}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${(timeLeft / 15) * 100}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {question.question}
      </h2>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            disabled={timeLeft === 0}
            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
              selectedAnswer === index
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : timeLeft === 0
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
      
      {timeLeft === 0 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center">
          ⏰ Time's up! Moving to next question...
        </div>
      )}
    </div>
  );
}

// Results Component - shows final score and review
function Results({ score, totalQuestions, onRestart, answers, questions }) {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  return (
    <div className="text-center">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Quiz Complete!</h2>
        <div className="text-6xl font-bold mb-4">
          <span className={percentage >= 70 ? 'text-green-500' : percentage >= 50 ? 'text-yellow-500' : 'text-red-500'}>
            {percentage}%
          </span>
        </div>
        <p className="text-xl text-gray-600 mb-6">
          You scored {score} out of {totalQuestions} questions correctly
        </p>
        
        {/* Review Section */}
        <div className="text-left mb-6">
          <h3 className="text-lg font-semibold mb-4">Review Your Answers:</h3>
          {questions.map((question, index) => (
            <div key={question.id} className="mb-4 p-4 border rounded-lg">
              <p className="font-medium mb-2">{question.question}</p>
              <div className="flex items-center space-x-4 text-sm">
                {answers[index] !== null ? (
                  <>
                    <span className={`px-2 py-1 rounded ${
                      answers[index] === question.correctAnswer 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Your answer: {question.options[answers[index]]}
                    </span>
                    {answers[index] !== question.correctAnswer && (
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                        Correct: {question.options[question.correctAnswer]}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">
                    No answer (time ran out)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={onRestart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Take Quiz Again
        </button>
      </div>
    </div>
  );
}

function App() {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds per question
  const [timerActive, setTimerActive] = useState(false);

  // Load quiz data from API
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch questions from Open Trivia DB
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // You can customize the API URL:
      // amount: number of questions (1-50)
      // category: 18=Computer Science, 9=General Knowledge, etc.
      // difficulty: easy, medium, hard
      const response = await fetch("https://opentdb.com/api.php?amount=10&category=18&type=multiple");
      const data = await response.json();
      
      if (data.response_code === 0) {
        const transformedQuestions = transformApiData(data.results);
        setQuestions(transformedQuestions);
        console.log("Fetched questions:", transformedQuestions);
      } else {
        throw new Error("Failed to fetch questions from API");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load quiz questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Timer effect - runs every second when timer is active
  useEffect(() => {
    let interval = null;
    
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            // Time's up! Auto-advance to next question
            handleTimeUp();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  // Start timer when questions load
  useEffect(() => {
    if (questions.length > 0 && !showResults) {
      setTimerActive(true);
      setTimeLeft(15);
    }
  }, [questions, currentQuestionIndex, showResults]);

  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    if (timeLeft > 0) {
      setSelectedAnswer(answerIndex);
      setTimerActive(false); // Stop timer when answer is selected
    }
  };

  // Handle time running out
  const handleTimeUp = () => {
    setTimerActive(false);
    // Auto-advance after a short delay
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };

  // Move to next question or show results
  const handleNextQuestion = () => {
    // Save the answer (null if time ran out)
    const finalAnswer = selectedAnswer;
    const newAnswers = [...answers, finalAnswer];
    setAnswers(newAnswers);

    // Check if answer is correct (only if an answer was selected)
    if (finalAnswer !== null && finalAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    // Move to next question or show results
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(15); // Reset timer
      setTimerActive(true); // Restart timer
    } else {
      setShowResults(true);
      setTimerActive(false);
    }
  };

  // Restart the quiz
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResults(false);
    setScore(0);
    setTimeLeft(15);
    setTimerActive(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl">Loading quiz questions...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <div className="text-red-500 text-xl mb-4">Oops! Something went wrong</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchQuestions}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-xl">No questions available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Quiz Challenge
        </h1>
        
        {showResults ? (
          <Results 
            score={score}
            totalQuestions={questions.length}
            onRestart={handleRestart}
            answers={answers}
            questions={questions}
          />
        ) : (
          <div>
            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm text-gray-600">
                  Score: {score}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Question */}
            <Question
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswerSelect}
              selectedAnswer={selectedAnswer}
              timeLeft={timeLeft}
              onTimeUp={handleTimeUp}
            />

            {/* Next Button */}
            <div className="text-center">
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null && timeLeft > 0}
                className={`py-3 px-8 rounded-lg font-semibold transition-colors ${
                  selectedAnswer !== null || timeLeft === 0
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {timeLeft === 0 ? 'Continue' : currentQuestionIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
              </button>
              
              {selectedAnswer === null && timeLeft > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Select an answer or wait for the timer to continue
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;