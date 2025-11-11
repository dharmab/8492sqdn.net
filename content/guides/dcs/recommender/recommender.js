// Track selected tags separately for single (OR) and multiple (AND/OR/ANY) questions
let singleQuestionTags = new Set(); // Tags from radio button questions (OR logic)
let multipleQuestionTagsAnd = new Set(); // Tags from checkbox questions with AND logic
let multipleQuestionTagsByQuestion = {}; // Tags from checkbox questions with OR logic, grouped by question
let multipleQuestionTagsAny = new Set(); // Tags from checkbox questions with ANY logic (combined across all ANY questions)
let selectedAnswersByQuestion = {}; // For tracking radio button selections
let hasNonDefaultInput = false; // Track if user has made any non-default selections
let data = null; // Will be populated from JSON file

// Initialize the page
async function init() {
  try {
    // Load data from JSON file
    const response = await fetch("recommender-data.json");
    data = await response.json();

    renderQuestions();
    initializeDefaults();
    renderChoices();
    filterChoices();
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("questions-container").innerHTML =
      '<p style="color: red;">Error loading recommender data. Please refresh the page.</p>';
  }
}

// Initialize default selections
function initializeDefaults() {
  data.questions.forEach((question) => {
    if (question.type === "single" && question.default) {
      // For single-choice questions with a default, select it
      const defaultAnswer = question.answers.find(
        (a) => a.id === question.default,
      );
      if (defaultAnswer) {
        const input = document.getElementById(defaultAnswer.id);
        if (input) {
          input.checked = true;
          // Add default tags to singleQuestionTags
          defaultAnswer.tags.forEach((tag) => singleQuestionTags.add(tag));
          // Track the default selection
          selectedAnswersByQuestion[question.id] = {
            answerId: defaultAnswer.id,
            tags: defaultAnswer.tags,
          };
        }
      }
    }
  });
}

// Render all questions
function renderQuestions() {
  const container = document.getElementById("questions-container");
  container.innerHTML = "";

  data.questions.forEach((question) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";

    const questionText = document.createElement("h3");
    questionText.textContent = question.text;

    const answersDiv = document.createElement("div");
    answersDiv.className = "answers";

    question.answers.forEach((answer) => {
      const answerDiv = document.createElement("div");
      answerDiv.className = "answer-option";

      const input = document.createElement("input");
      const inputType = question.type === "single" ? "radio" : "checkbox";
      input.type = inputType;
      input.id = answer.id;
      input.name = question.id; // Group radio buttons by question

      if (inputType === "radio") {
        input.addEventListener("change", (e) =>
          handleRadioChange(e, question.id, answer.id, answer.tags),
        );
      } else {
        input.addEventListener("change", (e) =>
          handleCheckboxChange(e, answer.id, answer.tags, question.id),
        );
      }

      const label = document.createElement("label");
      label.textContent = answer.text;

      answerDiv.appendChild(input);
      answerDiv.appendChild(label);
      answersDiv.appendChild(answerDiv);
    });

    // Add "No preference" option to all questions
    const noPreferenceDiv = document.createElement("div");
    noPreferenceDiv.className = "answer-option";

    const noPreferenceInput = document.createElement("input");
    // Use radio button for single questions, checkbox for multiple questions
    noPreferenceInput.type = question.type === "single" ? "radio" : "checkbox";
    noPreferenceInput.id = `${question.id}-no-preference`;
    noPreferenceInput.name =
      question.type === "single" ? question.id : `${question.id}-no-preference`;

    if (question.type === "single") {
      // For radio buttons, use handleRadioChange with empty tags
      noPreferenceInput.addEventListener("change", (e) =>
        handleRadioChange(e, question.id, `${question.id}-no-preference`, []),
      );
    } else {
      // For checkboxes, use handleNoPreferenceChange
      noPreferenceInput.addEventListener("change", (e) =>
        handleNoPreferenceChange(e, question.id, question.type),
      );
    }

    const noPreferenceLabel = document.createElement("label");
    noPreferenceLabel.textContent = "No preference";

    noPreferenceDiv.appendChild(noPreferenceInput);
    noPreferenceDiv.appendChild(noPreferenceLabel);
    answersDiv.appendChild(noPreferenceDiv);

    questionDiv.appendChild(questionText);
    questionDiv.appendChild(answersDiv);
    container.appendChild(questionDiv);
  });
}

// Handle "No preference" checkbox
function handleNoPreferenceChange(event, questionId, questionType) {
  if (event.target.checked) {
    // Uncheck all other options in this question
    const question = data.questions.find((q) => q.id === questionId);
    question.answers.forEach((answer) => {
      const input = document.getElementById(answer.id);
      if (input && input.checked) {
        input.checked = false;
        // Trigger the appropriate handler to clean up tags
        if (questionType === "single") {
          // Remove tags for radio buttons
          if (selectedAnswersByQuestion[questionId]) {
            const previousAnswer = selectedAnswersByQuestion[questionId];
            previousAnswer.tags.forEach((tag) =>
              singleQuestionTags.delete(tag),
            );
            delete selectedAnswersByQuestion[questionId];
          }
        } else {
          // Remove tags for checkboxes
          const operator = question.operator || "and";
          if (operator === "or") {
            if (multipleQuestionTagsByQuestion[questionId]) {
              delete multipleQuestionTagsByQuestion[questionId];
            }
          } else if (operator === "any") {
            answer.tags.forEach((tag) => multipleQuestionTagsAny.delete(tag));
          } else {
            answer.tags.forEach((tag) => multipleQuestionTagsAnd.delete(tag));
          }
        }
      }
    });
    filterChoices();
  }
}

// Handle checkbox selection changes (AND, OR, or ANY logic depending on question)
function handleCheckboxChange(event, answerId, tags, questionId) {
  // Uncheck "No preference" if any option is selected
  if (event.target.checked) {
    const noPreferenceInput = document.getElementById(
      `${questionId}-no-preference`,
    );
    if (noPreferenceInput) {
      noPreferenceInput.checked = false;
    }
  }

  // Find the question to check its operator
  const question = data.questions.find((q) => q.id === questionId);
  const operator = question.operator || "and"; // Default to AND if not specified

  if (operator === "or") {
    // For OR questions, track tags per question
    if (!multipleQuestionTagsByQuestion[questionId]) {
      multipleQuestionTagsByQuestion[questionId] = new Set();
    }

    if (event.target.checked) {
      tags.forEach((tag) =>
        multipleQuestionTagsByQuestion[questionId].add(tag),
      );
    } else {
      tags.forEach((tag) =>
        multipleQuestionTagsByQuestion[questionId].delete(tag),
      );
    }

    // Clean up empty sets
    if (multipleQuestionTagsByQuestion[questionId].size === 0) {
      delete multipleQuestionTagsByQuestion[questionId];
    }
  } else if (operator === "any") {
    // For ANY questions, combine all tags into a single set
    if (event.target.checked) {
      tags.forEach((tag) => multipleQuestionTagsAny.add(tag));
    } else {
      tags.forEach((tag) => multipleQuestionTagsAny.delete(tag));
    }
  } else {
    // For AND questions, use the global set
    if (event.target.checked) {
      tags.forEach((tag) => multipleQuestionTagsAnd.add(tag));
    } else {
      tags.forEach((tag) => multipleQuestionTagsAnd.delete(tag));
    }
  }

  // Mark that user has made a selection (checkbox questions don't have defaults)
  // But exclude the "type" question
  if (questionId !== "type") {
    hasNonDefaultInput = true;
  }
  filterChoices();
}

// Handle radio button selection changes (OR logic across questions)
function handleRadioChange(event, questionId, answerId, tags) {
  // Remove tags from previously selected answer in this question
  if (selectedAnswersByQuestion[questionId]) {
    const previousAnswer = selectedAnswersByQuestion[questionId];
    previousAnswer.tags.forEach((tag) => singleQuestionTags.delete(tag));
  }

  // Add tags from newly selected answer
  tags.forEach((tag) => singleQuestionTags.add(tag));

  // Track the current selection for this question
  selectedAnswersByQuestion[questionId] = { answerId, tags };

  // Check if this is a non-default selection on a question other than "type"
  if (questionId !== "type") {
    const question = data.questions.find((q) => q.id === questionId);
    if (!question.default || question.default !== answerId) {
      hasNonDefaultInput = true;
    }
  }

  filterChoices();
}

// Filter and display choices
function filterChoices() {
  const choiceCards = document.querySelectorAll(".choice-card");

  choiceCards.forEach((card) => {
    // Hide all results if user hasn't made any non-default selections
    if (!hasNonDefaultInput) {
      card.classList.add("hidden");
    } else if (
      singleQuestionTags.size === 0 &&
      multipleQuestionTagsAnd.size === 0 &&
      Object.keys(multipleQuestionTagsByQuestion).length === 0 &&
      multipleQuestionTagsAny.size === 0
    ) {
      // Show all if no filters selected but user has made input
      card.classList.remove("hidden");
    } else {
      const choiceTags = card.dataset.tags.split(",");
      let matchesSingle = true;
      let matchesMultipleAnd = true;
      let matchesMultipleOr = true;
      let matchesMultipleAny = true;

      // Check single (radio) questions - choice must match ANY of the selected tags (OR logic)
      if (singleQuestionTags.size > 0) {
        matchesSingle = Array.from(singleQuestionTags).some((tag) =>
          choiceTags.includes(tag),
        );
      }

      // Check multiple (checkbox) questions with AND logic - choice must match ALL selected tags
      if (multipleQuestionTagsAnd.size > 0) {
        matchesMultipleAnd = Array.from(multipleQuestionTagsAnd).every((tag) =>
          choiceTags.includes(tag),
        );
      }

      // Check multiple (checkbox) questions with OR logic -
      // For each OR question, choice must match at least ONE tag from that question
      if (Object.keys(multipleQuestionTagsByQuestion).length > 0) {
        matchesMultipleOr = Object.values(multipleQuestionTagsByQuestion).every(
          (questionTags) =>
            Array.from(questionTags).some((tag) => choiceTags.includes(tag)),
        );
      }

      // Check multiple (checkbox) questions with ANY logic -
      // Choice must match at least ONE tag from ALL selected ANY tags
      if (multipleQuestionTagsAny.size > 0) {
        matchesMultipleAny = Array.from(multipleQuestionTagsAny).some((tag) =>
          choiceTags.includes(tag),
        );
      }

      // Show choice only if it matches all conditions
      if (
        matchesSingle &&
        matchesMultipleAnd &&
        matchesMultipleOr &&
        matchesMultipleAny
      ) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    }
  });

  checkForResults();
}

// Render all choices
function renderChoices() {
  const container = document.getElementById("choices-container");
  container.innerHTML = "";

  // Sort choices by rating (descending), then sortKey, then title
  const sortedChoices = [...data.choices].sort((a, b) => {
    // First, sort by rating (higher rating first)
    const ratingA = a.rating || 2;
    const ratingB = b.rating || 2;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    // Then by sortKey
    const sortKeyA = a.sortKey || "";
    const sortKeyB = b.sortKey || "";
    if (sortKeyA !== sortKeyB) {
      return sortKeyA.localeCompare(sortKeyB);
    }

    // Finally by title
    return a.title.localeCompare(b.title);
  });

  sortedChoices.forEach((choice) => {
    const card = document.createElement("div");
    card.className = "choice-card";
    card.dataset.tags = choice.tags.join(",");

    const title = document.createElement("div");
    title.className = "choice-title";
    title.textContent = choice.title;

    card.appendChild(title);

    // Create a content wrapper for the image and text content
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "choice-content-wrapper";

    // Add cover image if available
    if (choice.coverImage) {
      const coverImg = document.createElement("img");
      coverImg.src = `images/${choice.coverImage}`;
      coverImg.alt = `${choice.title} cover art`;
      coverImg.className = "choice-cover";
      contentWrapper.appendChild(coverImg);
    }

    // Create a container for description and tags
    const textContent = document.createElement("div");
    textContent.className = "choice-text-content";

    const description = document.createElement("div");
    description.className = "choice-description";
    description.textContent = choice.description;

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "choice-tags";

    choice.tags.forEach((tag) => {
      const tagSpan = document.createElement("span");
      tagSpan.className = "tag";
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });

    textContent.appendChild(description);
    textContent.appendChild(tagsContainer);
    contentWrapper.appendChild(textContent);
    card.appendChild(contentWrapper);

    // Create store links container or not available message
    const hasLinks =
      choice.steamURL ||
      choice.eShopURL ||
      choice.heatblurURL ||
      choice.downloadURL;

    const linksContainer = document.createElement("div");
    linksContainer.className = "choice-links";

    if (hasLinks) {
      if (choice.steamURL) {
        const steamLink = document.createElement("a");
        steamLink.href = choice.steamURL;
        steamLink.target = "_blank";
        steamLink.rel = "noopener noreferrer";
        steamLink.className = "store-link steam-link";
        steamLink.textContent = "Steam";
        linksContainer.appendChild(steamLink);
      }

      if (choice.eShopURL) {
        const dcsLink = document.createElement("a");
        dcsLink.href = choice.eShopURL;
        dcsLink.target = "_blank";
        dcsLink.rel = "noopener noreferrer";
        dcsLink.className = "store-link dcs-link";
        dcsLink.textContent = "DCS E-Shop";
        linksContainer.appendChild(dcsLink);
      }

      if (choice.heatblurURL) {
        const heatblurLink = document.createElement("a");
        heatblurLink.href = choice.heatblurURL;
        heatblurLink.target = "_blank";
        heatblurLink.rel = "noopener noreferrer";
        heatblurLink.className = "store-link heatblur-link";
        heatblurLink.textContent = "Heatblur Store";
        linksContainer.appendChild(heatblurLink);
      }

      if (choice.downloadURL) {
        const downloadLink = document.createElement("a");
        downloadLink.href = choice.downloadURL;
        downloadLink.target = "_blank";
        downloadLink.rel = "noopener noreferrer";
        downloadLink.className = "store-link download-link";
        downloadLink.textContent = "Download";
        linksContainer.appendChild(downloadLink);
      }
    } else {
      const notAvailable = document.createElement("span");
      notAvailable.className = "not-available";
      notAvailable.style.color = "red";
      notAvailable.textContent = "Delisted - No longer available for purchase";
      linksContainer.appendChild(notAvailable);
    }

    card.appendChild(linksContainer);
    container.appendChild(card);
  });

  checkForResults();
}

// Check if there are any visible results
function checkForResults() {
  const container = document.getElementById("choices-container");
  const visibleChoices = document.querySelectorAll(
    ".choice-card:not(.hidden)",
  ).length;

  // Remove existing no-results message if any
  const existingNoResults = document.querySelector(".no-results");
  if (existingNoResults) {
    existingNoResults.remove();
  }

  // Add no-results message if needed
  if (visibleChoices === 0 && hasNonDefaultInput) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.innerHTML = `
            <h3>No matches found</h3>
            <p>No modules found that meet all options. Try selecting fewer options.</p>
        `;
    container.appendChild(noResults);
  }
}

// Reset all filters
function resetFilters() {
  singleQuestionTags.clear();
  multipleQuestionTagsAnd.clear();
  multipleQuestionTagsByQuestion = {};
  multipleQuestionTagsAny.clear();
  selectedAnswersByQuestion = {};
  hasNonDefaultInput = false;
  document
    .querySelectorAll('input[type="checkbox"], input[type="radio"]')
    .forEach((input) => {
      input.checked = false;
    });
  filterChoices();
}

// Initialize on page load
init();
