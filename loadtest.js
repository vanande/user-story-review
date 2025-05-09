import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// --- Configuration ---
const MIN_THINK_TIME = 60; // 1 minute in seconds
const MAX_THINK_TIME = 180; // 3 minutes in seconds

export const options = {
  stages: [
    { duration: '5s', target: 5 },
    { duration: '3600s', target: 20 }, // Duration for VUs to run their iterations
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'http_req_duration{group:::1. Fetch Stories for Review}': ['p(95)<600'],
    'http_req_duration{group:::2. Submit Feedback}': ['p(95)<400'],
    'http_req_duration{group:::3. Fetch Dashboard Stats}': ['p(95)<500'],
    'checks': ['rate>0.98'],
  },
  ext: {
    loadimpact: {
      projectID: null,
      name: "User Story Review - Tester Load Scenario"
    }
  }
};

const fetchStoriesDuration = new Trend('fetch_stories_duration', true);
const submitFeedbackDuration = new Trend('submit_feedback_duration', true);
const dashboardStatsDuration = new Trend('dashboard_stats_duration', true);

const BASE_URL = __ENV.K6_ENV_BASE_URL || 'http://localhost:3000';

// --- Helper Functions ---
function getRandomLetter() { /* ... */ }
function getRandomLastname() { /* ... */ }
function getRandomDigits(count) { /* ... */ }
function generateDynamicEmail() { /* ... */ }
function getRandomEvaluationValue() { /* ... */ }
function generateRandomEvaluations() { /* ... */ }
// (Keep helper functions as they were, they are correct)
function getRandomLetter() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function getRandomLastname() {
  const lastnames = [
    "Smith", "Jones", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson",
    "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark",
    "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King", "Wright",
    "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter", "Mitchell",
    "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins"
  ];
  return lastnames[Math.floor(Math.random() * lastnames.length)];
}

function getRandomDigits(count) {
  let digits = '';
  for (let i = 0; i < count; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

function generateDynamicEmail() {
  const randomLetter = getRandomLetter();
  const randomLastname = getRandomLastname();
  const randomThreeDigits = getRandomDigits(3);
  return `${randomLetter}.${randomLastname}-${randomThreeDigits}@example.com`.toLowerCase();
}

function getRandomEvaluationValue() {
  const rand = Math.random() * 100;
  if (rand < 70) return "yes";
  if (rand < 90) return "no";
  return "partial";
}

function generateRandomEvaluations() {
  const principles = ["Independent", "Negotiable", "Valuable", "Estimable", "Small", "Testable"];
  const evaluations = {};
  principles.forEach(principle => {
    evaluations[principle] = getRandomEvaluationValue();
  });
  return evaluations;
}

function think() {
  // Calculate a random think time between MIN_THINK_TIME and MAX_THINK_TIME
  const duration = Math.random() * (MAX_THINK_TIME - MIN_THINK_TIME) + MIN_THINK_TIME;
  sleep(duration);
}
// --- End Helper Functions ---


export default function () {
  const currentUserEmail = generateDynamicEmail();
  let storyIdsAvailableForReview = [];
  let numberOfReviewsToSubmit = 0;

  group('1. Fetch Stories for Review', function () {
    const fetchStoriesUrl = `${BASE_URL}/api/stories?testerId=${encodeURIComponent(currentUserEmail)}`;
    const res = http.get(fetchStoriesUrl);
    fetchStoriesDuration.add(res.timings.duration);

    let successfulFetch = check(res, {
      '[Fetch Stories] Status is 200': (r) => r.status === 200,
      '[Fetch Stories] Response body is an object': (r) => typeof r.json() === 'object',
      '[Fetch Stories] Response has success=true': (r) => r.json('success') === true,
      '[Fetch Stories] Response has stories array': (r) => Array.isArray(r.json('stories')),
    });

    if (successfulFetch) {
      try {
        const responseData = res.json();
        if (responseData.stories && responseData.stories.length > 0) {
          storyIdsAvailableForReview = responseData.stories
            .map(story => story.id)
            .filter(id => typeof id === 'number');
          if (storyIdsAvailableForReview.length > 0) {
            const maxReviewsPossible = storyIdsAvailableForReview.length;
            numberOfReviewsToSubmit = Math.floor(Math.random() * Math.min(maxReviewsPossible, 3)) + 1;
          }
        } else {
          numberOfReviewsToSubmit = 0;
        }
      } catch (e) {
        numberOfReviewsToSubmit = 0;
      }
    } else {
      numberOfReviewsToSubmit = 0;
    }
  });

  think(); // Apply think time after fetching stories

  if (numberOfReviewsToSubmit > 0 && storyIdsAvailableForReview.length > 0) {
    for (let i = 0; i < numberOfReviewsToSubmit; i++) {
      if (storyIdsAvailableForReview.length === 0) break;
      const currentStoryIdForFeedback = storyIdsAvailableForReview.shift();

      group('2. Submit Feedback', function () {
        const feedbackUrl = `${BASE_URL}/api/feedback`;
        const payload = JSON.stringify({
          storyId: currentStoryIdForFeedback,
          evaluations: generateRandomEvaluations(),
          additionalFeedback: `Test feedback from ${currentUserEmail}`,
          email: currentUserEmail,
        });
        const params = { headers: { 'Content-Type': 'application/json' } };
        const res = http.post(feedbackUrl, payload, params);
        submitFeedbackDuration.add(res.timings.duration);

        check(res, {
          [`[Submit Feedback StoryID: ${currentStoryIdForFeedback}] Status is 200 or 201`]: (r) => r.status === 200 || r.status === 201,
          [`[Submit Feedback StoryID: ${currentStoryIdForFeedback}] Response success is true`]: (r) => {
            try { return r.json('success') === true; } catch (e) { return false; }
          },
        });
      });

      // Apply think time *between* feedback submissions IF there are more reviews to submit
      if (i < numberOfReviewsToSubmit - 1) {
        think();
      }
    }
  }

  group('3. Fetch Dashboard Stats', function () {
    const dashboardStatsUrl = `${BASE_URL}/api/dashboard/stats?email=${encodeURIComponent(currentUserEmail)}`;
    const res = http.get(dashboardStatsUrl);
    dashboardStatsDuration.add(res.timings.duration);
    check(res, {
      '[Dashboard Stats] Status is 200': (r) => r.status === 200,
    });
  });

  think();
}