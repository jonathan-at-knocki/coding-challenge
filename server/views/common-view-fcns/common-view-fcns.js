// common functions for views

exports.gradePercentStr = function gradePercentStr(
  questionsAnswered, questionsCorrect) {
  if (!(typeof questionsCorrect === 'number'
        && typeof questionsAnswered === 'number')
      || questionsAnswered === 0
      || isNaN(questionsCorrect / questionsAnswered)) return 'n/a';

  // eslint-disable-next-line no-mixed-operators
  return Math.round(questionsCorrect / questionsAnswered * 100) + '%';
};

// get the grade class for questions answered, questions correct
exports.gradeClass = function gradeClass(
  questionsAnswered, questionsCorrect) {
  /* eslint-disable no-else-return */
  var grade;
  if (questionsAnswered === 0) {
    return 'grade-newquiz';
  } else {
    grade = questionsCorrect / questionsAnswered;
    if (grade < 0.6) return 'grade-f';
    if (grade < 0.7) return 'grade-d';
    else if (grade < 0.8) return 'grade-c';
    else if (grade < 0.9) return 'grade-b';
    else if (grade < 1) return 'grade-a';
    else return 'grade-perfect';
  }
  /* eslint-enable no-else-return */
};

// from http://stackoverflow.com/a/6234804
exports.escapeHtml = function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

exports.printDate = function printDate(date) {
  return (date.toLocaleDateString('en-US')
          + ' ' + date.toLocaleTimeString('en-US', { hour12: false }));
};
