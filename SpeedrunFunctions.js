// some functionality adapted from https://d3-graph-gallery.com/graph/scatter_basic.html

// Globals
const colors = ["#ff0000","#00ff00","#0000ff"];
var legendSize = 0;
var minDate;
var maxDate;
var maxMillisec = 36000;
const margin = {top: 10, right: 30, bottom: 30, left: 60},
  width = 1000 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

function addAxes() {
  // append the svg object to the body of the page
  var svg = d3.select("#graph-pane")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("id","graph")
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // get & validate date bounds //
  var minYear = document.getElementById("year1");
  if(minYear.value.length == 1){
    minYear.value = "200"+minYear.value;
  }else if(minYear.value.length == 2){
    minYear.value = "20"+minYear.value;
  }else if(minYear.value.length != 4){
    minYear.value = "2016";
  }
  var maxYear = document.getElementById("year2");
  if(maxYear.value.length == 1){
    maxYear.value = "200"+maxYear.value;
  }else if(maxYear.value.length == 2){
    maxYear.value = "20"+maxYear.value;
  }else if(maxYear.value.length != 4){
    maxYear.value = "2016";
  }
  var minMonth = document.getElementById("month1");
  if(minMonth.value.length == 1){
    minMonth.value = "0"+minMonth.value;
  }else if(minMonth.value.length != 2){
    minMonth.value = "01";
  }
  var maxMonth = document.getElementById("month2");
  if(maxMonth.value.length == 1){
    maxMonth.value = "0"+maxMonth.value;
  }else if(maxMonth.value.length != 2){
    maxMonth.value = "01";
  }
  var minDay = document.getElementById("day1");
  if(minDay.value.length == 1){
    minDay.value = "0"+minDay.value;
  }else if(minDay.value.length != 2){
    minDay.value = "01";
  }
  var maxDay = document.getElementById("day2");
  if(maxDay.value.length == 1){
    maxDay.value = "0"+maxDay.value;
  }else if(maxDay.value.length != 2){
    maxDay.value = "01";
  }

  minDate = new Date(minYear.value+"-"+minMonth.value+"-"+minDay.value);
  maxDate = new Date(maxYear.value+"-"+maxMonth.value+"-"+maxDay.value);
  console.log("Date range is from "+minDate.toISOString()+" to "+maxDate.toISOString());

  // Add X axis
  var x = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, maxMillisec])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));
};

function refreshAxes(){
  var graphPane = document.getElementById("graph-pane");
  var oldGraph = document.getElementById("graph");
  if (oldGraph) {
    graphPane.removeChild(oldGraph);
    addAxes();
    populateGraph();
  }
};

function populateGraph(){
  // Get modules from legend
  const legendModules = d3.selectAll(".legend-module");

  var x = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, width]);
  var y = d3.scaleLinear()
    .domain([0, maxMillisec])
    .range([height, 0]);

  // Add data for each module
  legendModules.each(function(d, index) {
    // Get game & cateory & level
    const gameDropdown = d3.select(this).select(".game-dropdown");
    const categoryDropdown = d3.select(this).select(".category-dropdown");
    const levelDropdown = d3.select(this).select(".level-dropdown");

    // Build API call string
    var apiString = `https://www.speedrun.com/api/v1/leaderboards/${gameDropdown.property("value")}`;
    if(levelDropdown.property("value") != "0"){
      apiString += `/levels/${levelDropdown.property("value")}`;
      if(categoryDropdown.property("value") != "0"){
        apiString += `/${categoryDropdown.property("value")}`;
      }
    }else if(categoryDropdown.property("value") != "0"){
      apiString += `/category/${categoryDropdown.property("value")}`;
    }

    //Read the data
    d3.json(apiString, function(data) {
      console.log("making API call: "+apiString);

      // Add points to graph
      var graph = d3.select("#graph");
      graph.append('g')
        .selectAll("circle")
        .data(data.data.runs)
        .enter()
        .append("circle")
          .attr("cx", d => x(new Date(d.run.submitted)))
          .attr("cy", d => y(d.run.times.primary_t))
          .attr("r", 1.5)
          .attr("runID", d => (d.run.id) )
          .style("fill", colors[index])
          .on("click", function (d){
            // Display specfic run information to the textbox
            var textBox = document.getElementById("data-box");
            textBox.value = "Run ID: " + d.run.id;
            textBox.value = "Leaderboard Place: " + d.place;
            textBox.value += "\nRun Submitted:" + d.run.submitted;
          });
    })
  });
};

// called upon module creation
function populateGameDropdown(moduleId) {
  d3.json("https://www.speedrun.com/api/v1/games?_bulk=yes", function(data) {
    // populate game dropdown with game titles & ids
    d3.select("#"+moduleId)
      .select(".game-dropdown")
      .selectAll("option")
      .data(data.data)
      .enter()
      .append("option")
        .property("value", d => d.id)
        .text(d => d.names.international);
  });
};

// dependent on game chosen, per API docs
// called by game-dropdown onchange
function populateCategoryDropdown(moduleId) {
  var gameDropdown = d3.select("#"+moduleId).select(".game-dropdown");
  var categoryDropdown = d3.select("#"+moduleId).select(".category-dropdown");
  categoryDropdown.selectAll("option").remove();
  categoryDropdown.append("option")
    .property("value","0")
    .text("N/A");

  d3.json(`https://www.speedrun.com/api/v1/games/${gameDropdown.property("value")}/categories`, function(data) {
    categoryDropdown.selectAll("option")
      .data(data.data)
      .enter()
      .append("option")
        .property("value", d => d.id)
        .property("type", d => d.type)
        .text(d => d.name)
  });
};

function populateLevelDropdown(moduleId) {
  var gameDropdown = d3.select("#"+moduleId).select(".game-dropdown");
  var levelDropdown = d3.select("#"+moduleId).select(".level-dropdown");
  levelDropdown.selectAll("option").remove();
  levelDropdown.append("option")
    .property("value","0")
    .text("N/A");

  d3.json(`https://www.speedrun.com/api/v1/games/${gameDropdown.property("value")}/levels`, function(data) {
    levelDropdown.selectAll("option")
      .data(data.data)
      .enter()
      .append("option")
        .property("value", d => d.id)
        .text(d => d.name)
  });
};

function handleCategorySelect(dropdown, moduleId){
  if(dropdown.options[dropdown.selectedIndex].type == "per-level"){
    populateLevelDropdown(moduleId);
  }else{
    populateGraph();
  }
};

// Adds a module to the legend
function initModule(){
  // Update legendSize & crate moduleId
  legendSize += 1;
  var moduleId = "module"+legendSize.toString();

  // Append new module to legend
  var legend = d3.select("#legend");
  legend.append("div")
      .attr("id",moduleId)
      .attr("class","legend-module")

  // Add elements to module
  var module = d3.select("#"+moduleId);

  // Game
  module.append("p")
    .text("Game:");
  module.append("select")
    .attr("class","game-dropdown")
    .append("option")
      .property("value","0")
      .text("None");
    
  // Category
  module.append("p")
    .text("Category:");
  module.append("select")
    .attr("class", "category-dropdown")
    .append("option")
      .property("value","0")
      .text("N/A");
  
  // Level
  module.append("p")
    .text("Level:");
  module.append("select")
    .attr("class", "level-dropdown")
    .append("option")
      .property("value","0")
      .text("N/A");

  // Color
  module.append("circle")
    .style("fill", colors[legendSize-1])
    .attr("r","3");

  // Remove Button
  module.append("button")
    .text("Remove")
    .on("click", function(){
      console.log("Removing  "+moduleId);
      removeModule(moduleId);
    });

  // Add games to dropdown
  populateGameDropdown(moduleId);

  module.select(".game-dropdown")
    .on("change", function() {
      console.log("Game selection changed in "+moduleId);
      populateCategoryDropdown(moduleId);
    });

  module.select(".category-dropdown")
    .on("change", function() {
      console.log("Category selection changed in "+moduleId);
      handleCategorySelect(this, moduleId);
    });

  module.select(".level-dropdown")
    .on("change", function() {
      console.log("level selection changed in "+moduleId);
      populateGraph()
    });
};

function removeModule(moduleId){
  // Remove module in question
  var module = d3.select("#"+moduleId);
  module.remove();
  legendSize -= 1;

  var remainingModules = d3.selectAll(".legend-module");
  remainingModules.each(function(d,i){
    var currentModule = d3.select(this);
    currentModule.attr("id","module"+(i+1).toString());
    currentModule.select("circle").style("fill",colors[i]);
  });

  //refreshAxes();
};