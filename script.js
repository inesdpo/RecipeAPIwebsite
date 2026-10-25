//------------------------------Recipes pages------------------------------

function addRecipes(){
    const url = "https://www.themealdb.com/api/json/v1/1/random.php";
    const recipesCardsGrid = document.getElementById("recipe-cards-grid");

    const numberOfRecipes = 12; 

    const requests = [];

    for (let i = 0; i < numberOfRecipes; i++) {
        requests.push(
            fetch(url).then(response => response.json())
        );
    } //requests the number of recipes from the API

    
    Promise.all(requests) //Waits for all requests to finish
        .then(results => {
            let htmlBlock = "";

            results.forEach(data => { //takes the results and builds a card for each recipe
                const meal = data.meals[0];

                htmlBlock += `
                <div class="col-md-3 mb-3 recipe-card" data-id="${meal.idMeal}">
                    <div class="card h-100">
                        <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}">
                        <div class="card-body">
                            <h5 class="card-title">
                                ${meal.strMeal} 
                            </h5>
                            <p class="card-text"><i class="bi bi-globe-americas"></i> ${meal.strArea}
                            </p>
                        </div>
                    </div>
                </div>
                `;
            });

            recipesCardsGrid.innerHTML = htmlBlock; //adds the cards to the page

            recipesCardsGrid.querySelectorAll(".recipe-card") // Add event listeners to each recipe card
                .forEach(card => {
                    card.addEventListener("click", () => {
                        window.location.href =
                            `recipe.html?id=${card.dataset.id}`; // Redirects to the recipe page with the selected recipe ID
                    });
                });
        })

    .catch(error => {
        console.error("Could not load recipe:", error);
    });
}

const recipeSearchButton = document.getElementById("recipe-search-button");
const recipeSearchInput = document.getElementById("recipe-search-input");
const recipeFilters = [
    { button: recipeSearchButton, endpoint: "search.php", parameter: "s" },
    { button: document.getElementById("recipe-filter-ingredient"), endpoint: "filter.php", parameter: "i" },
    { button: document.getElementById("recipe-filter-category"), endpoint: "filter.php", parameter: "c" },
    { button: document.getElementById("recipe-filter-country"), endpoint: "filter.php", parameter: "a" }
].filter(filter => filter.button);

recipeFilters.forEach(filter => {
    filter.button.addEventListener("click", () => filterRecipes(filter));
});

async function filterRecipes(filter) {
    const term = recipeSearchInput.value.trim();

    if (!term) {
        alert("Please enter a search term.");
        return;
    }

    const url = `https://www.themealdb.com/api/json/v1/1/${filter.endpoint}?${filter.parameter}=${encodeURIComponent(term)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}.`);
        }

        const data = await response.json();
        const recipesCardsGrid = document.getElementById("recipe-cards-grid");

        if (!data.meals) {
            recipesCardsGrid.innerHTML = "<p>No recipes found for that search.</p>";
            return;
        }

        recipesCardsGrid.innerHTML = data.meals.map(meal => `
            <div class="col-md-3 mb-3 recipe-card" data-id="${meal.idMeal}">
                <div class="card h-100">
                    <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}">
                    <div class="card-body">
                        <h5 class="card-title">${meal.strMeal}</h5>
                    </div>
                </div>
            </div>
        `).join("");

        recipesCardsGrid.querySelectorAll(".recipe-card").forEach(card => {
            card.addEventListener("click", () => {
                window.location.href = `recipe.html?id=${encodeURIComponent(card.dataset.id)}`;
            });
        });
    } catch (error) {
        console.error("Could not filter recipes:", error);
    }
}

//------------------------------Recipe------------------------------
function getSavedRecipeIds() {
    const savedRecipes = JSON.parse(localStorage.getItem("savedRecipes") || "[]");
    if (!Array.isArray(savedRecipes) || savedRecipes.some(id => typeof id !== "string")) {
        throw new Error("Saved recipes data is invalid.");
    }
    return savedRecipes;
}

function displayMeal(meal) {
    // Build the ingredient list from the numbered fields returned by TheMealDB.
    // Get the ingredients and measures from the meal object
    const ingredients = [];

    // Check how many ingredients are present and add them to the list
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`]; //Get the ingredients
        const measure = meal[`strMeasure${i}`]; //Get the measures
        // Check if the ingredient exists and is not empty then create it and add it to the list
        if (ingredient && ingredient.trim() !== "") {
            ingredients.push(`<li>${measure || ""} ${ingredient}</li>`);
        }
    }

    //Adds the data to the html recipe page
    const recipeContainer = document.getElementById("recipe-content");
    // Render the ingredients and instructions together in the recipe content area.
    recipeContainer.innerHTML = `
        <div class="row justify-content-center">
            <!-- Instructions -->
            <div class="col-md-6">
                <div class="mt-3 mt-md-0">
                    <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                        <h1 class="mb-0" id="recipe-title-container">${meal.strMeal}</h1>
                        <button type="button" id="save-recipe-button" class="btn btn-outline-primary flex-shrink-0" aria-pressed="false"><i class="bi bi-bookmark"></i></button>
                    </div>
                    <p class="mb-4" id="recipe-country-container"><i class="bi bi-globe-americas"></i> ${meal.strArea}</p>
                    <h4>Instructions</h4>
                    <p id="recipe-instructions">${meal.strInstructions}</p>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h4 class="card-title">Ingredients</h4>
                        <ul id="recipe-ingredients-list">
                            ${ingredients.join("")}
                        </ul>
                    </div>
                </div>
            </div>
        </div>`;

    const saveButton = document.getElementById("save-recipe-button");
    const updateSaveButton = isSaved => {
        saveButton.setAttribute("aria-pressed", String(isSaved));
        saveButton.classList.toggle("active", isSaved);
        saveButton.innerHTML = isSaved
            ? '<i class="bi bi-bookmark-check"></i>'
            : '<i class="bi bi-bookmark"></i>';
    };

    try {
        updateSaveButton(getSavedRecipeIds().includes(meal.idMeal));
    } catch (error) {
        console.error("Could not read saved recipes:", error);
    }

    saveButton.addEventListener("click", () => {
        try {
            const savedRecipeIds = getSavedRecipeIds();
            const recipeIndex = savedRecipeIds.indexOf(meal.idMeal);
            const isSaved = recipeIndex !== -1;

            if (isSaved) {
                savedRecipeIds.splice(recipeIndex, 1);
            } else {
                savedRecipeIds.push(meal.idMeal);
            }

            localStorage.setItem("savedRecipes", JSON.stringify(savedRecipeIds));
            updateSaveButton(!isSaved);
        } catch (error) {
            console.error("Could not save recipe:", error);
        }
    });
}

function loadRecipeById(mealId) {
    // Request the recipe selected on the recipes page using its ID.
    const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(mealId)}`;
    fetch(url).then(function (response) {return response.json()}).then(function(data){
        if (!data.meals || data.meals.length === 0) {
            throw new Error("No recipe found for the requested ID.");
        }
        // Pass the returned recipe to the page renderer.
        displayMeal(data.meals[0]);
    }).catch(function (error) {
        console.error("Could not load recipe:", error);
    });
}

const recipeContent = document.getElementById("recipe-content");
if (recipeContent) {
    // Only fetch a recipe when the current page is the recipe detail page.
    const mealId = new URLSearchParams(window.location.search).get("id");
    if (mealId) {
        loadRecipeById(mealId);
    } else {
        console.error("Could not load recipe: no recipe ID was provided.");
    }
}

//------------------------------Saved Recipes-----------------------
function addSavedRecipes(){
    const savedRecipesGrid = document.getElementById("saved-recipe-cards-grid");
    if (!savedRecipesGrid) {
        return;
    }

    let savedRecipeIds;
    try {
        savedRecipeIds = getSavedRecipeIds();
    } catch (error) {
        console.error("Could not read saved recipes:", error);
        savedRecipesGrid.innerHTML = "<p>Could not load your saved recipes.</p>";
        return;
    }

    if (savedRecipeIds.length === 0) {
        savedRecipesGrid.innerHTML = "<p class=\"text-center\">You have no saved recipes yet.</p>";
        return;
    }

    Promise.all(savedRecipeIds.map(id =>
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Recipe request failed with status ${response.status}.`);
                }
                return response.json();
            })
            .then(data => {
                if (!data.meals || data.meals.length === 0) {
                    throw new Error(`No recipe found for saved ID ${id}.`);
                }
                return data.meals[0];
            })
    ))
        .then(meals => {
            savedRecipesGrid.innerHTML = meals.map(meal => `
                <div class="col-md-3 mb-3 saved-recipe-card" data-id="${meal.idMeal}">
                    <div class="card h-100">
                        <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}">
                        <div class="card-body">
                            <h5 class="card-title">${meal.strMeal}</h5>
                            <p class="card-text"><i class="bi bi-globe-americas"></i> ${meal.strArea}</p>
                        </div>
                    </div>
                </div>
            `).join("");

            savedRecipesGrid.querySelectorAll(".saved-recipe-card").forEach(card => {
                card.addEventListener("click", () => {
                    window.location.href = `recipe.html?id=${encodeURIComponent(card.dataset.id)}`;
                });
            });
        })
        .catch(error => {
            console.error("Could not load saved recipes:", error);
            savedRecipesGrid.innerHTML = "<p>Could not load your saved recipes. Please try again later.</p>";
        });
}

//------------------------------Pantry------------------------------

let pantry = [];
const pantryIngredientList = document.getElementById("pantry-ingredient-list");
const pantryIngredientInput = document.getElementById("pantry-ingredient-input");
const pantryExpiryInput = document.getElementById("pantry-expiry-input");
const addPantryIngredientButton = document.getElementById("add-pantry-ingredient-button");
const pantryIngredientForm = document.getElementById("pantry-ingredient-form");
const pantryIngredientOptions = document.getElementById("pantry-ingredient-options");
const pantryMessage = document.getElementById("pantry-message");

if (pantryIngredientList && pantryIngredientInput && pantryExpiryInput &&
    addPantryIngredientButton && pantryIngredientForm && pantryIngredientOptions &&
    pantryMessage) {
    pantryIngredientForm.addEventListener("submit", addIngredient);
    loadPantry();
    displayPantry();
    loadAvailablePantryIngredients();
}

async function loadAvailablePantryIngredients() {
    try {
        const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?i=list");
        if (!response.ok) {
            throw new Error(`Ingredient request failed with status ${response.status}.`);
        }

        const data = await response.json();
        if (!Array.isArray(data.meals)) {
            throw new Error("The ingredient API returned an invalid response.");
        }

        const ingredients = data.meals
            .map(item => item.strIngredient)
            .filter(name => typeof name === "string" && name.trim() !== "");
        if (ingredients.length === 0) {
            throw new Error("The ingredient API did not return any ingredients.");
        }

        pantryIngredientOptions.innerHTML = "";
        ingredients.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            pantryIngredientOptions.appendChild(option);
        });

        addPantryIngredientButton.disabled = false;
    } catch (error) {
        console.error("Could not load pantry ingredients:", error);
        pantryMessage.textContent = "Could not load ingredients. Please refresh to try again.";
    }
}

function addIngredient(event) {
    event.preventDefault();
    const selectedName = pantryIngredientInput.value.trim();
    const ingredientOption = Array.from(pantryIngredientOptions.options)
        .find(option => option.value.toLowerCase() === selectedName.toLowerCase());

    if (!ingredientOption) {
        pantryMessage.textContent = "Choose an ingredient from the API suggestions.";
        pantryIngredientInput.focus();
        return;
    }

    if (!pantryExpiryInput.value) {
        pantryExpiryInput.focus();
        return;
    }

    pantry.push({ name: ingredientOption.value, expiryDate: pantryExpiryInput.value });
    try {
        savePantry();
    } catch (error) {
        pantry.pop();
        console.error("Could not save pantry:", error);
        pantryMessage.textContent = "Could not save your pantry. Please check your browser storage settings.";
        return;
    }

    pantryIngredientForm.reset();
    pantryIngredientInput.focus();
    pantryMessage.textContent = "";
    displayPantry();
}

function loadPantry() {
    const saved = localStorage.getItem("pantry");
    if (saved === null) {
        return;
    }

    try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.some(item =>
            !item || typeof item.name !== "string" ||
            (item.expiryDate !== undefined && typeof item.expiryDate !== "string")
        )) {
            throw new Error("Saved pantry data has an invalid format.");
        }
        pantry = parsed.map(item => ({
            name: item.name,
            expiryDate: item.expiryDate || ""
        }));
    } catch (error) {
        console.error("Could not read saved pantry:", error);
        pantryMessage.textContent = "Could not read your saved pantry. Additions may replace invalid saved data.";
    }
}

function savePantry() {
    localStorage.setItem("pantry", JSON.stringify(pantry));
}

function displayPantry() {
    pantryIngredientList.innerHTML = "";

    pantry.forEach((item, i) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center gap-3";

        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = item.name;
        const expiry = document.createElement("div");
        expiry.className = "small text-muted";
        expiry.textContent = item.expiryDate
            ? `Expires ${new Date(`${item.expiryDate}T00:00:00`).toLocaleDateString()}`
            : "Expiry date not recorded";
        details.append(name, expiry);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-outline-danger btn-sm flex-shrink-0";
        removeButton.setAttribute("aria-label", `Remove ${item.name}`);
        removeButton.innerHTML = '<i class="bi bi-trash"></i>';
        removeButton.addEventListener("click", () => {
            const removedItem = pantry.splice(i, 1)[0];
            try {
                savePantry();
                displayPantry();
                pantryMessage.textContent = "";
            } catch (error) {
                pantry.splice(i, 0, removedItem);
                console.error("Could not save pantry:", error);
                pantryMessage.textContent = "Could not update your pantry. Please check your browser storage settings.";
            }
        });

        li.append(details, removeButton);
        pantryIngredientList.appendChild(li);
    });

    if (pantry.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "list-group-item text-muted";
        emptyMessage.textContent = "Your pantry is empty.";
        pantryIngredientList.appendChild(emptyMessage);
    }
}


