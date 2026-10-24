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

let pantry = []; // array of { name, checked }

const pantryIngredientList = document.getElementById("pantry-ingredient-list");
const pantryIngredientInput = document.getElementById("pantry-ingredient-input");
const addPantryIngredientButton = document.getElementById("add-pantry-ingredient-button");

// only run on pages that have the pantry (script.js is shared)
if (pantryIngredientList && pantryIngredientInput && addPantryIngredientButton) {
    addPantryIngredientButton.addEventListener("click", addIngredient);

    loadPantry();
    displayPantry();
}

function addIngredient() {
    const text = pantryIngredientInput.value.trim();
    if (text === "") return;

    pantry.push({ name: text, checked: false });
    pantryIngredientInput.value = "";
    pantryIngredientInput.focus();

    savePantry();
    displayPantry();
}

function savePantry() {
    localStorage.setItem("pantry", JSON.stringify(pantry));
}

function loadPantry() {
    const saved = localStorage.getItem("pantry");
    if (saved !== null) {
        try {
            pantry = JSON.parse(saved);
        } catch (e) {
            pantry = [];
        }
    }
}

function displayPantry() {
    pantryIngredientList.innerHTML = "";

    pantry.forEach((item, i) => {
        const li = document.createElement("li");
        li.className = "list-group-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "ingredient-" + i;
        checkbox.className = "pantry-ingredient-checkbox me-2";
        checkbox.checked = item.checked;
        checkbox.addEventListener("change", () => {
            pantry[i].checked = checkbox.checked;
            savePantry();
        });

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = item.name;

        li.append(checkbox, label);
        pantryIngredientList.appendChild(li);
    });
}

function removeIngredient(){
    
}
