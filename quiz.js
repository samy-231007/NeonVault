// Klasse für eine einzelne Frage
class Question {
    constructor(data) {
        this.question = data.question;
        this.correctAnswer = data.correct_answer;
        this.incorrectAnswers = data.incorrect_answers;
        this.allAnswers = [...this.incorrectAnswers, this.correctAnswer].sort(() => Math.random() - 0.5);
    }

    // Prüft, ob die Antwort korrekt ist
    isCorrect(answer) {
        return answer === this.correctAnswer;
    }
}

// Klasse für Quiz-Statistiken
class Statistics {
    constructor() {
        this.correct = 0;
        this.wrong = 0;
    }

    // Erhöht Zähler für korrekte/falsche Antworten
    addResult(isCorrect) {
        isCorrect ? this.correct++ : this.wrong++;
    }

    // Erstellt Diagramme mit Chart.js
    renderCharts(highScore) {
        // Ergebnis-Diagramm (Pie)
        const ctx1 = document.getElementById('resultChart').getContext('2d');
        new Chart(ctx1, {
            type: 'pie',
            data: {
                labels: ['Correct', 'Wrong'],
                datasets: [{
                    data: [this.correct, this.wrong],
                    backgroundColor: ['#28a745', '#dc3545']
                }]
            },
            options: { responsive: true }
        });

        // Highscore-Diagramm (Bar)
        const ctx2 = document.getElementById('highScoreChart').getContext('2d');
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Your Score', 'Highscore'],
                datasets: [{
                    label: 'Points',
                    data: [this.correct, highScore],
                    backgroundColor: ['#00f7ff', '#e91e63']
                }]
            },
            options: { responsive: true }
        });
    }
}

// Klasse für Highscore-Verwaltung
class HighScore {
    constructor() {
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    }

    // Aktualisiert Highscore
    update(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('highScore', this.highScore);
        }
        document.getElementById('highScore').textContent = this.highScore;
    }
}

// Hauptklasse für das Quiz
class Quiz {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.stats = new Statistics();
        this.highScore = new HighScore();
        this.timer = null;
        this.timeLeft = 15;
        this.initEventListeners();
    }

    // Initialisiert Event-Listener
    initEventListeners() {
        document.getElementById('startQuiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('restartQuiz').addEventListener('click', () => this.restartQuiz());
    }

    // Startet das Quiz
    async startQuiz() {
        const category = document.getElementById('category').value;
        document.getElementById('startScreen').classList.add('d-none');
        document.getElementById('quizScreen').classList.remove('d-none');
        await this.fetchQuestions(category);
        this.showQuestion();
        this.startTimer();
    }

    // Lädt Fragen von Open Trivia DB
    async fetchQuestions(category) {
        const response = await fetch(`https://opentdb.com/api.php?amount=5&category=${category}&type=multiple`);
        const data = await response.json();
        this.questions = data.results.map(item => new Question(item));
    }

    // Startet den Timer
    startTimer() {
        this.timeLeft = 15;
        const bar = document.getElementById('timerBar');
        bar.style.width = '100%';
        this.timer = setInterval(() => {
            this.timeLeft -= 0.1;
            bar.style.width = `${(this.timeLeft / 15) * 100}%`;
            if (this.timeLeft <= 0) {
                this.stats.addResult(false);
                this.nextQuestion();
            }
        }, 100);
    }

    // Zeigt die aktuelle Frage
    showQuestion() {
        clearInterval(this.timer);
        this.startTimer();
        const question = this.questions[this.currentQuestionIndex];
        document.getElementById('questionNumber').textContent = `Question ${this.currentQuestionIndex + 1}`;
        document.getElementById('questionText').innerHTML = question.question;
        const answersDiv = document.getElementById('answers');
        answersDiv.innerHTML = '';
        question.allAnswers.forEach(answer => {
            const btn = document.createElement('button');
            btn.className = 'btn answer-btn btn-block';
            btn.innerHTML = answer;
            btn.addEventListener('click', () => this.checkAnswer(answer));
            answersDiv.appendChild(btn);
        });
        document.getElementById('score').textContent = this.score.toFixed(1);
    }

    // Prüft die Antwort und aktualisiert Punkte
    checkAnswer(answer) {
        clearInterval(this.timer);
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = question.isCorrect(answer);
        const timeBonus = this.timeLeft > 10 ? 1.5 : 1; // Bonus für schnelle Antworten
        this.stats.addResult(isCorrect);
        if (isCorrect) {
            this.score += timeBonus;
        }
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.innerHTML === question.correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.innerHTML === answer && !isCorrect) {
                btn.classList.add('wrong');
            }
        });
        setTimeout(() => this.nextQuestion(), 1000);
    }

    // Zeigt die nächste Frage oder Ergebnisse
    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    }

    // Zeigt die Ergebnisse
    showResults() {
        document.getElementById('quizScreen').classList.add('d-none');
        document.getElementById('resultScreen').classList.remove('d-none');
        document.getElementById('finalScore').textContent = this.score.toFixed(1);
        this.highScore.update(this.score);
        this.stats.renderCharts(this.highScore.highScore);
    }

    // Startet ein neues Quiz
    restartQuiz() {
        window.location.reload();
    }
}

// Initialisiert das Quiz
const quiz = new Quiz();