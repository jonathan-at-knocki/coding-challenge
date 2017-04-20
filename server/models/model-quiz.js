// the model for a quiz
// a quiz is a series of questions and attempted answers for one initial ip
// address

const mongoose = require('mongoose');

// one quiz question
const questionSchema = new mongoose.Schema({
  // the IP address at the time of answering
  ip: { type: String, required: true },
  askTime: { type: Date, required: true },
  number1: { type: Number, required: true },
  number2: { type: Number, required: true },
  // correct answer: obviously, recalculating the answer is easy, but if
  // the problem were more complicated, one might want to be able to store
  // the correct answer
  answerCorrect: { type: Number, required: true },
  answerGiven: { type: Number, required: false }
});

// one quiz
const quizSchema = new mongoose.Schema({
  startIp: { type: String, required: true },
  startTime: { type: Date, required: true },
  questionsAnswered: { type: Number, required: true },
  questionsCorrect: { type: Number, required: true },
  questions: [questionSchema]
});


// generate a random 2-digit number
function genNum() {
  // 198 = 99 - (-99)
  return Math.floor((Math.random() * 198) - 99);
}

// generate a new quiz question.
// Note: this does not update the
// previously answered question with a response nor does it save the
// document; thus, it is not publicly callable
function generateQuestion(quiz, ip) {
  const number1 = genNum();
  const number2 = genNum();
  quiz.questions.push({
    ip,
    askTime: new Date(),
    number1,
    number2,
    answerCorrect: number1 * number2
  });
}

// start a new quiz
// callback(err, newQuiz)
quizSchema.statics.startNew = function startNew(startIp, callback) {
  const newQuiz = new this({
    startIp,
    startTime: new Date(),
    questionsAnswered: 0,
    questionsCorrect: 0
  });
  generateQuestion(newQuiz, startIp);
  // save also expects a callback(err, newQuiz)
  newQuiz.save(callback);
};

// answer a question, update question stats, and generate a new question
// callback(errback, question)
quizSchema.methods.answerQuestion = function answerQuestion(
  answer, ip, callback) {
  // note that there is always at least one question
  this.questionsAnswered += 1;

  const answeredQues = this.questions[this.questions.length - 1];
  answeredQues.answerGiven = answer;
  if (answer === answeredQues.answerCorrect) {
    this.questionsCorrect += 1;
  }

  // generate new question
  generateQuestion(this, ip);

  this.save(callback);
};

//  does a quiz have the proper structure to be shown?
quizSchema.methods.isOk = function isOk() {
  return (this && this.startIp && this.startTime instanceof Date
          && (typeof this.questionsCorrect === 'number')
          && (typeof this.questionsAnswered === 'number'));
};

mongoose.model('Quiz', quizSchema);
