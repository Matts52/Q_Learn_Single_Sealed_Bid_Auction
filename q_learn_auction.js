


/*** RANDOMIZATION FUNCTIONS */

//standard random normal
function randn() {
    var u = Math.random();
    var v = Math.random();
    var z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z;
  }

//random normal distribution for the value of the item being bid on
function value_rand_norm(mu, sigma) {
    function inner_func() {
        return Math.min(Math.max(Math.round(randn() * sigma + mu), 0), 10);
    }
    return inner_func;
}


//random normal distribution for the other players bid
function other_player_rand_norm(mu, sigma) {
    function inner_func() {
        return Math.min(Math.max(Math.round(randn() * sigma + mu), 0), 10);
    }
    return inner_func;
}

/*** Agent Utility Function */
//our agent's simple utility function
function basic_agent_utility(risk_aversion=1.0, risk_loving=1.0) {
    function inner_func(reward) {
        if (reward < 0) {
            return risk_aversion * reward;
        } else {
            return risk_loving * reward;
        }
    }
    return inner_func;
}


/*** GAME SIMULATION ***/
//simulate one round of the game
function simulate_game(agent_bid, other_bid, value, game){
    //decide the payouts based on game type
    if (game == "traditional"){
        loss_amount = 0;
        win_amount = value - agent_bid;
    } else if (game == "reverse"){
        loss_amount = 0;
        win_amount = value - other_bid;
    } else if (game == "traditional loser pays"){
        loss_amount = -1 * other_bid;
        win_amount = value;
    } else if (game = "reverse loser pays"){
        loss_amount = -1 * agent_bid;
        win_amount = value;
    }

    //agent returns
    if (agent_bid < other_bid) {
        return loss_amount;
    } else {
        return win_amount;
    }
}


/*** PLOTTING FUNCTIONS ***/
//plot a histogram
function plot_hist(data, html_id, x_axis, y_axis, title){
    
    var trace = {
        x: data,
        type: 'histogram',
      };
    var data = [trace];

    var layout = {
        title: title,
        xaxis: {title: x_axis},
        yaxis: {title: y_axis},
        width: window.innerWidth * 0.35,
        height: window.innerHeight * 0.35
    };

    Plotly.newPlot(html_id, data, layout);

}

//plot a stp function
function plot_step(x, y, html_id, x_axis, y_axis, title){
    var trace = {
        x: x,
        y: y,
        type: 'step',
        mode: 'lines+markers',
        line: {
            color: 'blue',
            width: 2
        }
    };

    var layout = {
        title: title,
        xaxis: {title: x_axis},
        yaxis: {title: y_axis},
        width: window.innerWidth * 0.33,
        height: window.innerHeight * 0.35
    };

    var data = [trace];
    Plotly.newPlot(html_id, data, layout);
}

//plot a dual histogram
function plot_two_histograms(data1, data2, html_id, label1, label2, x_axis, y_axis, title){

    var trace1 = {
        x: data1,
        name: label1,
        type: 'histogram'
    };

    var trace2 = {
        x: data2,
        name: label2,
        type: 'histogram'
    };

    var data = [trace1, trace2];

    var layout = {
        title: title,
        xaxis: {title: x_axis},
        yaxis: {title: y_axis},
        width: window.innerWidth * 0.33,
        height: window.innerHeight * 0.35
    };

    Plotly.newPlot(html_id, data, layout);
}



/*** MAIN ALGORITHM ***/

/*** Allow the agent to apply the Q-Learning algorithm ***/
function learn_the_game(alpha, gamma, epsilon, other_player_func, agent_utility_func, value_func, game, num_rounds, results=false) {

    // Define the action space
    const action_space = Array.from(Array(11).keys());
  
    // Init the Q table with zeroes
    const Q = Array.from(Array(1), () => new Array(action_space.length).fill(0));
  
    let state = 0;
    let next_state = 0; // since we only have a starting bid of zero each time, always 0 [one state]
  
    const rewards = [];
    const utilities = [];
    const other_bids = [];
    const agent_bids = [];
  
    const eps_step = epsilon / num_rounds;
  
    // Loop until convergence
    for (let i = 0; i < num_rounds; i++) {
  
      // Choose an action based on actor policy and epsilon-greedy exploration
      let action;
      if (Math.random() < epsilon) {
        action = action_space[Math.floor(Math.random() * action_space.length)];
      } else {
        action = Q[state].indexOf(Math.max(...Q[state]));
      }
  
      // generate the other player's move based on the inputted function
      const other_action = other_player_func();
  
      // determine underlying value of the item
      const value = value_func();
  
      // Simulate the game to get the reward and next state
      const reward = simulate_game(action, other_action, value, game=game);
      rewards.push(reward);
  
      // calculate the agent utility as the maximization parameter
      const utility = agent_utility_func(reward);
      utilities.push(utility);

      // record the actions
      agent_bids.push(action);
      other_bids.push(other_action);
  
      // Update the Q-table
      Q[state][action] += alpha * (utility + gamma * Math.max(...Q[next_state]) - Q[state][action]);
  
      // anneal the epsilon
      epsilon -= eps_step;
    }
  
    // normalize our Q parameter
    const np_Q = Q[0];
    const normed_out = np_Q.map(x => x / Math.sqrt(np_Q.reduce((a, b) => a + b * b, 0)));

    //find expected winnings/utility as well as the optimal choice dictated by our q-learning algorithm
    const mean_winnings = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    const mean_utility = utilities.reduce((a, b) => a + b, 0) / utilities.length;
    const opt_choice = Q[0].indexOf(Math.max(...Q[0]));
  
    //debugging information
    if (results) {
      // Print the final Q-table
      console.log("Optimal Choice: ", opt_choice);
      console.log("Mean Winnings: ", mean_winnings);
      console.log("Mean Utility: ", mean_utility);
      console.log("Normalized Q-table: ");
      normed_out.forEach((value, index) => console.log(" Key:", index, "Value:", value));
    }
  
    //update the outputted results
    document.getElementById("averageWin").textContent = "Average Winnings: " + mean_winnings.toFixed(2);
    document.getElementById("averageUtil").textContent = "Average Utility: " + mean_utility.toFixed(2);
    document.getElementById("optimalBid").textContent = "Optimal Bid: " + opt_choice;

    //Update the Plotted results
    plot_hist(rewards, "myHist", "Winnings", "Count", "Agent Winnings");
    plot_hist(utilities, "myHist2", "Utility", "Count", "Agent Utilities");
    plot_step(action_space, normed_out, "myStep", "Agent Bid", "L1 Normalized Q-value", "Q-table Values for Bids");
    plot_two_histograms(agent_bids, other_bids, "myDoubleHist", "Agent Bids", "Other Bids", "Bid", "Count", "Agent vs. Other Bid")

    //return the relevant information in the case that we want to do things with this in the future (ex. find the distribution of mean winnings)
    return [mean_winnings, mean_utility, normed_out, opt_choice];
  }



/*** MAIN PROGRAM ***/

//listener on the simulation button
document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    //read in all of the user selections
    let game_to_play = document.getElementById('game_type').value;
    let alpha = parseFloat(document.getElementById('alpha').value);
    let gamma = parseFloat(document.getElementById('gamma').value);
    let epsilon = parseFloat(document.getElementById('epsilon').value);
    let other_mean = parseFloat(document.getElementById('other_mean').value);
    let other_std = parseFloat(document.getElementById('other_std').value);
    let risk_aversion = parseFloat(document.getElementById('risk_aversion').value);
    let risk_loving = parseFloat(document.getElementById('risk_loving').value);
    let value_mean = parseFloat(document.getElementById('value_mean').value);
    let value_std = parseFloat(document.getElementById('value_std').value);
    let num_rounds = parseFloat(document.getElementById('num_rounds').value);

    //construct the generators
    let other_func = other_player_rand_norm(mu=other_mean, sigma=other_std);
    let agent_func = basic_agent_utility(risk_aversion=risk_aversion, risk_loving=risk_loving);
    let value_func = value_rand_norm(mu=value_mean,sigma=value_std);
    
    //run the simulation
    Q_sim = learn_the_game(alpha=alpha, gamma=gamma, epsilon=epsilon, other_player_func=other_func, 
                           agent_utility_func=agent_func, value_func=value_func,  game=game_to_play, num_rounds=num_rounds, 
                            results=false);
    
    console.log("Complete");

});



/*** SLIDER LISTENERS ***/

// Get references to all the range inputs
const alphaInput = document.getElementById('alpha');
const gammaInput = document.getElementById('gamma');
const epsilonInput = document.getElementById('epsilon');
const otherMeanInput = document.getElementById('other_mean');
const otherStdInput = document.getElementById('other_std');
const riskAversionInput = document.getElementById('risk_aversion');
const riskLovingInput = document.getElementById('risk_loving');
const valueMeanInput = document.getElementById('value_mean');
const valueStdInput = document.getElementById('value_std');
const numRoundsInput = document.getElementById('num_rounds');

// Get references to all the span elements to display the current values
const alphaValue = document.getElementById('alpha_value');
const gammaValue = document.getElementById('gamma_value');
const epsilonValue = document.getElementById('epsilon_value');
const otherMeanValue = document.getElementById('other_mean_value');
const otherStdValue = document.getElementById('other_std_value');
const riskAversionValue = document.getElementById('risk_aversion_value');
const riskLovingValue = document.getElementById('risk_loving_value');
const valueMeanValue = document.getElementById('value_mean_value');
const valueStdValue = document.getElementById('value_std_value');
const numRoundsValue = document.getElementById('num_rounds_value');

// Add listeners to each range input to update the corresponding span element
alphaInput.addEventListener('input', () => {alphaValue.textContent = alphaInput.value;});
gammaInput.addEventListener('input', () => {gammaValue.textContent = gammaInput.value;});
epsilonInput.addEventListener('input', () => {epsilonValue.textContent = epsilonInput.value;});
otherMeanInput.addEventListener('input', () => {otherMeanValue.textContent = otherMeanInput.value;});
otherStdInput.addEventListener('input', () => {otherStdValue.textContent = otherStdInput.value;});
riskAversionInput.addEventListener('input', () => {riskAversionValue.textContent = riskAversionInput.value;});
riskLovingInput.addEventListener('input', () => {riskLovingValue.textContent = riskLovingInput.value;});
valueMeanInput.addEventListener('input', () => {valueMeanValue.textContent = valueMeanInput.value;});
valueStdInput.addEventListener('input', () => {valueStdValue.textContent = valueStdInput.value;});
numRoundsInput.addEventListener('input', () => {numRoundsValue.textContent = numRoundsInput.value;});



