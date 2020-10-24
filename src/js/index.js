// Global app controller
// https://forkify-api.herokuapp.com/api/

import Search from './models/Search';
import List from './models/List';
import { elements, renderLoader, clearLoader } from './views/base';
import * as searchView from './views/searchView';
import Recipe from './models/Recipe';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Likes from './models/Likes';
// import List from './models/List';

/** Global State Of App 
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
*/
const state = {};

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
     // Get the qery from view
    const query = searchView.getInput(); //TODO
    //  const query = 'pizza';
    //  console.log(query);
      
     if (query){
        // New Search object and add to state
        state.search = new Search(query);

        //Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            //Search for recipes
            await state.search.getResults();  //returns a promise

            //Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }
        catch (e){
            alert('Something went wrong with the page!!');
            clearLoader();
        }
        
     }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

//TESTING
// window.addEventListener('load', e => {
//     e.preventDefault();
//     controlSearch();
// });

elements.searchResPages.addEventListener("click", e => {
    const btn = e.target.closest('.btn-inline');
    // console.log(btn);
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
        // console.log(goToPage);
    }
})

/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
    //Get the ID from URL
    const id = window.location.hash.replace('#', '');
    // console.log(id);

    if (id) {
      //prepare the UI for changes
      recipeView.clearRecipes();
      renderLoader(elements.recipe);

      //highlight selected search item
      if (state.search){
        searchView.highlightSelected(id);
      }
      //create the recipe object
      state.recipe = new Recipe(id);

      //Test
    //   window.r = state.recipe;

      try {
         //get recipe data and parse data
         await state.recipe.getRecipe();
         state.recipe.parseIngredients();

         //calc time n serv
         state.recipe.calcTime();
         state.recipe.calcServings();

         //render the recipe
         clearLoader();
         recipeView.clearRecipes();
         recipeView.renderRecipe(state.recipe,
            state.likes.isLiked(id)
            );
      }
      catch (e){
          alert('Error Processing recipe!!');
      }
      
    }
}


['hashchange', 'load'].forEach(event => {
    window.addEventListener(event, controlRecipe);
})


/**
 * List CONTROLLER
 */

const controlList = () => {
    //create a new list if none
    if (!state.list){
        state.list = new List();
    }

    //add each ing to list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });

}


// handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //handle delet button
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        //delete from state
        state.list.deleteItem(id);  
        //delete from ui
        listView.deleteItem(id);
        //handel count update
    } else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        if (val > 0)
        {
            state.list.updateCount(id, val);
        } 
    }
})


/**
 * Like CONTROLLER
 */

 const controlLike = () => {
     if(!state.likes) state.likes = new Likes();
     const currentId = state.recipe.id;
     
     //user has not yet liked current recipe
     
     if (!state.likes.isLiked(currentId)){
        //add like to the state
        const newLike = state.likes.addLike(currentId, state.recipe.title, state.recipe.author, state.recipe.img);

        //toggle the like button
        likesView.toggleLikeBtn(true);

        //add like to ui list
        
        likesView.renderLike(newLike);
        // console.log(state.likes);
        //user has liked the current recipe
     } else {
        //remove like to the state
        state.likes.deleteLike(currentId);

        //toggle the like button
        likesView.toggleLikeBtn(false);

        //remove like to ui list
        likesView.deleteLike(currentId);
        // console.log(state.likes);
     }
     likesView.toggleLikeMenu(state.likes.getNumLikes());     

 }

//restore like recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //restore likes
    state.likes.readStorage();

    //toggle the button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render the existing likes
    state.likes.likes.forEach(el => likesView.renderLike(el));
})


//handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
       //Decraese is clicked
       if (state.recipe.servings > 1) {
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
       }
    } else if (e.target.matches('.btn-increase, .btn-increase *')){
        //Decraese is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
     } else if (e.target.matches('.recipe__btn-add, .recipe__btn-add *')){
         //add ingredient to shopping list
         controlList();
     } else if (e.target.matches('.recipe__love, .recipe__love *')){
         //like controller
         controlLike();
     }
});


