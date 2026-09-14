jsPsych.plugins["rdk-image"] = (function() {
    var plugin = {};

    // Define plugin information and parameters
    plugin.info = {
        name: "rdk-image",
        parameters: {
            trial_duration: { type: jsPsych.plugins.parameterType.INT, default: 20000 }, // Duration of the trial in milliseconds
            aperture_width: { type: jsPsych.plugins.parameterType.INT, default: 400 }, // Width of the dot area
            aperture_height: { type: jsPsych.plugins.parameterType.INT, default: 400 }, // Height of the dot area
            image_url: { type: jsPsych.plugins.parameterType.ARRAY, default: ['img/bee_blue.png', 'img/bee_orange.png'] }, // Array of image URLs for the dots
            dot_speed: { type: jsPsych.plugins.parameterType.INT, default: 2 }, // Speed of the moving dots
            image_size: { type: jsPsych.plugins.parameterType.INT, default: 20 }, // Size of the dot images
            sample_sizes: { type: jsPsych.plugins.parameterType.ARRAY, default: [10, 20, 40, 80, 160, 320] }, // Number of dots displayed at each interval
            interval_duration: { type: jsPsych.plugins.parameterType.INT, default: 3333 }, // Duration of each interval in milliseconds
            effect_size: { type: jsPsych.plugins.parameterType.FLOAT, default: 0 }, // Effect size for the current trial
            nudge: { type: jsPsych.plugins.parameterType.INT, default: 17 } // Whether to show nudge graph at the end of the current trial
        }
    };

    var hyperSpeed = 1;
    var speedChange = false;
    var trial_rt;

    function should_show_popup(is_practice) {
        return is_practice === false; // Popups show for regular trials
    }
    
    // Define the core functionality of the plugin
    plugin.trial = function(display_element, trial) {
        var start_time = performance.now(); // Capture the start time of the trial

        // Define the beehive configurations based on the effect size
        var beehiveA = { blue: 160, orange: 160 };
        var beehiveB = { blue: 170, orange: 150 };
        var current_beehive = trial.effect_size === 0 ? beehiveA : beehiveB;

        var effect_name;
        switch(trial.effect_size) {
        case 0:
            effect_name = 'non_biased';
            break;
        case 0.01:
            effect_name = 'misleading_blue_non_biased';
            break;
        case -0.01:
            effect_name = 'misleading_orange_non_biased';
            break;
        case 0.02:
            effect_name = 'misleading_blue';
            break;
        case -0.02:
            effect_name = 'misleading_orange';
            break;
        case 0.03:
            effect_name = 'biased_blue';
            break;
        case -0.03:
            effect_name = 'biased_orange';
            break;
        default:
            effect_name = 'Nothing';
    }

        // Arrays to store dot positions and directions
        var dot_positions = [], dot_directions = [];

        // Create a container div for the dots (bees) and add it to the display element
        var container = document.createElement("div");
        container.style.position = "absolute";
        container.style.width = trial.aperture_width + "px";
        container.style.height = trial.aperture_height + "px";
        container.style.left = (window.innerWidth / 2) - (trial.aperture_width / 2) + "px";
        container.style.top = "50%";
        container.style.transform = "translateY(-50%)";
        container.style.overflow = "hidden";
        container.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
        container.style.border = "2px solid black";
        display_element.appendChild(container);

        // Variables to store trial data
        var current_interval = 0;
        var blue_counts = [], orange_counts = [];
        var response = null, correct = false, remaining_points = 0;

        // Create and display a timer to show remaining points
        var timer_display = document.createElement("div");
        timer_display.className = 'timer-box';
        if (trial.nudge == 4) {
            timer_display.style.visibility = 'hidden';
        }
        display_element.appendChild(timer_display);

        // Function to update the timer display and calculate remaining points
        function update_timer() {
            var elapsed_time = performance.now() - start_time;
            var remaining_time = Math.max(0, trial.trial_duration - elapsed_time);
            remaining_points = Math.ceil(remaining_time / 300); // Points decrease as time passes
            
            timer_display.innerHTML = "Points: " + remaining_points;
            
            // Continue updating the timer as long as there's time left
            if (remaining_time > 0) {
                requestAnimationFrame(update_timer);
            }
        }

        update_timer(); // Start the timer

        // Function to sample and display bees (dots) on the screen
        function sample_bees(num_new_dots, beehive, interval_index) {
            var blue_count = 0, orange_count = 0;

            // Define fixed counts of blue and orange bees for biased and non-biased trials
            var fixed_counts = {
                non_biased: [
                    { blue: 5, orange: 5 }, // Initial interval
                    { blue: 10, orange: 10 }, // Second interval
                    { blue: 20, orange: 20 }, // Third interval
                    { blue: 40, orange: 40 }, // Fourth interval
                    { blue: 80, orange: 80 }, // Fifth interval
                    { blue: 160, orange: 160 } // Final interval
                ],
                biased_blue: [
                    { blue: 6, orange: 4 }, // Initial interval
                    { blue: 12, orange: 8 }, // Second interval
                    { blue: 24, orange: 16 }, // Third interval
                    { blue: 48, orange: 32 }, // Fourth interval
                    { blue: 96, orange: 64 }, // Fifth interval
                    { blue: 192, orange: 128 } // Final interval
                ],
                biased_orange: [
                    { blue: 4, orange: 6 }, // Initial interval
                    { blue: 8, orange: 12 }, // Second interval
                    { blue: 16, orange: 24 }, // Third interval
                    { blue: 32, orange: 48 }, // Fourth interval
                    { blue: 64, orange: 96 }, // Fifth interval
                    { blue: 128, orange: 192 } // Final interval
                ],
                misleading_orange: [
                    { blue: 5, orange: 5 }, // Initial interval
                    { blue: 10, orange: 10 }, // Second interval
                    { blue: 19, orange: 21 }, // Third interval
                    { blue: 32, orange: 48 }, // Fourth interval
                    { blue: 64, orange: 96 }, // Fifth interval
                    { blue: 128, orange: 192 } // Final interval
                ],
                misleading_blue: [
                    { blue: 5, orange: 5 }, // Initial interval
                    { blue: 10, orange: 10 }, // Second interval
                    { blue: 21, orange: 19 }, // Third interval
                    { blue: 48, orange: 32 }, // Fourth interval
                    { blue: 96, orange: 64 }, // Fifth interval
                    { blue: 192, orange: 128 } // Final interval
                ],
                misleading_blue_non_biased: [
                    { blue: 6, orange: 4 }, // Initial interval
                    { blue: 12, orange: 8 }, // Second interval
                    { blue: 21, orange: 19 }, // Third interval
                    { blue: 40, orange: 40 }, // Fourth interval
                    { blue: 80, orange: 80 }, // Fifth interval
                    { blue: 160, orange: 160 } // Final interval
                ],
                misleading_orange_non_biased: [
                    { blue: 4, orange: 6 }, // Initial interval
                    { blue: 8, orange: 12 }, // Second interval
                    { blue: 19, orange: 21 }, // Third interval
                    { blue: 40, orange: 40 }, // Fourth interval
                    { blue: 80, orange: 80 }, // Fifth interval
                    { blue: 160, orange: 160 } // Final interval
                ]
            };
            
            
            

            // Determine the effect size marker for trial type
            var current_counts;
            if (trial.effect_size === 0) {
                current_counts = fixed_counts.non_biased[interval_index];
            } else if (trial.effect_size === 0.03) {
                current_counts = fixed_counts.biased_blue[interval_index];
            } else if (trial.effect_size === -0.03) {
                current_counts = fixed_counts.biased_orange[interval_index];
            } else if (trial.effect_size === 0.02) {
                current_counts = fixed_counts.misleading_blue[interval_index];
            } else if (trial.effect_size === -0.02) {
                current_counts = fixed_counts.misleading_orange[interval_index];
            } else if (trial.effect_size === 0.01) {
                current_counts = fixed_counts.misleading_blue_non_biased[interval_index];
            } else if (trial.effect_size === -0.01) {
                current_counts = fixed_counts.misleading_orange_non_biased[interval_index];
            }
            



            blue_count = current_counts.blue;
            orange_count = current_counts.orange;

            // Loop through the number of dots to be displayed
            for (var j = 0; j < blue_count; j++) {
                // Create the blue bee image element
                var img = document.createElement("img");
                img.src = trial.image_url[0]; // Blue bee image
                img.style.position = "absolute";
                img.style.width = trial.image_size + "px";
                img.style.height = trial.image_size + "px";
                img.style.left = Math.random() * (trial.aperture_width - trial.image_size) + "px";
                img.style.top = Math.random() * (trial.aperture_height - trial.image_size) + "px";
                container.appendChild(img);

                // Store the position and direction of the dot
                dot_positions.push({ x: parseFloat(img.style.left), y: parseFloat(img.style.top) });
                dot_directions.push({ x: (Math.random() - 0.5) * trial.dot_speed, y: (Math.random() - 0.5) * trial.dot_speed });
            }

            for (var k = 0; k < orange_count; k++) {
                // Create the orange bee image element
                var img = document.createElement("img");
                img.src = trial.image_url[1]; // Orange bee image
                img.style.position = "absolute";
                img.style.width = trial.image_size + "px";
                img.style.height = trial.image_size + "px";
                img.style.left = Math.random() * (trial.aperture_width - trial.image_size) + "px";
                img.style.top = Math.random() * (trial.aperture_height - trial.image_size) + "px";
                container.appendChild(img);

                // Store the position and direction of the dot
                dot_positions.push({ x: parseFloat(img.style.left), y: parseFloat(img.style.top) });
                dot_directions.push({ x: (Math.random() - 0.5) * trial.dot_speed, y: (Math.random() - 0.5) * trial.dot_speed });
            }

            // Store bee count for the current interval
            blue_counts.push(blue_count);
            orange_counts.push(orange_count);
        }


        // Function to update the positions of the dots (bees) on the screen
        function update_positions(speedMult) {
            for (var j = 0; j < dot_positions.length; j++) {
                var pos = dot_positions[j];
                var dir = dot_directions[j];

                // Update the position based on the direction and speed
                pos.x += dir.x * speedMult;
                pos.y += dir.y * speedMult;
                // Bounce off the walls of the container if a dot hits the edge
                if (pos.x <= 0) {
                    pos.x = 0;
                    dir.x *= -1;
                } else if (pos.x >= trial.aperture_width - trial.image_size) {
                    pos.x = trial.aperture_width - trial.image_size;
                    dir.x *= -1;
                }
                if (pos.y <= 0) {
                    pos.y = 0;
                    dir.y *= -1;
                } else if (pos.y >= trial.aperture_height - trial.image_size) {
                    pos.y = trial.aperture_height - trial.image_size;
                    dir.y *= -1;
                }
                // Update the dot's position on the screen
                container.children[j].style.left = pos.x + "px";
                container.children[j].style.top = pos.y + "px";
            }
            
            if (speedChange == false) {
                requestAnimationFrame(() => update_positions(speedMult)); // Continue updating positions
            }
                
        }

        // Function to handle the creation of new dots at set intervals
        function update_trial() {
            if (current_interval < trial.sample_sizes.length) {
                // Calculate the number of new dots to add at this interval
                var num_new_dots = trial.sample_sizes[current_interval] - (trial.sample_sizes[current_interval - 1] || 0);
                sample_bees(num_new_dots, current_beehive, current_interval); // Pass interval index
                current_interval++;
                // Set a timeout to call update_trial again after the interval duration
                jsPsych.pluginAPI.setTimeout(update_trial, trial.interval_duration / hyperSpeed);
            }
        }


        var trial_ended = false; // Flag to prevent the trial from ending multiple times

        // Function to end the trial and record data
        function end_trial() {
            if (!trial_ended) {
                trial_ended = true; // Prevent multiple endings
                if (!trial.is_practice) {
                    jsPsych.pluginAPI.clearAllTimeouts(); // Clear any remaining timeouts
                }
                const response_time = performance.now() - start_time; // Calculate response time
                trial_rt = response_time;
        
                // Check if this is a regular trial
                if (should_show_popup(trial.is_practice)) {
                    // If no response is recorded, show the "Are you paying attention?" popup
                    if (response === null) {
                        show_no_response_popup(); // Call the function to show the popup
                        return; // Stop further execution until the popup is closed
                    }
        
                    // If response was faster than 200ms, show a popup
                    if (response_time < 200) {
                        show_speed_popup(); // Call the function to show the popup
                        return; // Stop further execution until the popup is closed
                    }
                }

                if (trial.is_practice & response != null) {
                    // Run some kind of animation function here
                    play_remaining_trial();
                    return;
                } else if (trial.nudge <= 2 & response != null) {
                    play_remaining_trial();
                    return
                } else {
                    // Normal end trial logic
                    finalize_trial();
                }
            }
        }
        
        
        
        
        // Function to handle the speed popup with countdown
        function show_speed_popup() {
            // Create a popup element
            const popup = document.createElement("div");
            popup.id = "speed-popup";
            popup.style.position = "fixed";
            popup.style.top = "50%";
            popup.style.left = "50%";
            popup.style.transform = "translate(-50%, -50%)";
            popup.style.zIndex = "1000";
            popup.style.padding = "20px";
            popup.style.backgroundColor = "white";
            popup.style.border = "2px solid black";
            popup.style.textAlign = "center";

            // Add message to the popup
            const message = document.createElement("p");
            message.textContent = "Uh oh! You responded faster than humanly possible to perform the task";
            popup.appendChild(message);

            // Add countdown timer to the popup
            const countdown = document.createElement("p");
            countdown.id = "countdown-timer";
            countdown.textContent = "Continuing in 10 seconds...";
            popup.appendChild(countdown);

            // Append the popup to the body
            document.body.appendChild(popup);

            // Start a 10-second countdown
            let remainingTime = 10;
            const countdownInterval = setInterval(() => {
                remainingTime--;
                countdown.textContent = `Continuing in ${remainingTime} seconds...`;
                if (remainingTime <= 0) {
                    clearInterval(countdownInterval); // Stop the countdown
                    document.body.removeChild(popup); // Remove the popup
                    finalize_trial(); // Proceed to finalize the trial
                }
            }, 1000); // Update every second
        }

        function show_no_response_popup() {
            // Create a popup element
            const popup = document.createElement("div");
            popup.id = "no-response-popup";
            popup.style.position = "fixed";
            popup.style.top = "50%";
            popup.style.left = "50%";
            popup.style.transform = "translate(-50%, -50%)";
            popup.style.zIndex = "1000";
            popup.style.padding = "20px";
            popup.style.backgroundColor = "white";
            popup.style.border = "2px solid black";
            popup.style.textAlign = "center";

            // Add message to the popup
            const message = document.createElement("p");
            message.textContent = "Oh no! You didn't record a response before all the bees escaped! Are you paying attention?";
            popup.appendChild(message);

            // Add instruction to press SPACEBAR
            const instruction = document.createElement("p");
            instruction.textContent = "Press SPACEBAR to continue.";
            popup.appendChild(instruction);

            // Append the popup to the body
            document.body.appendChild(popup);

            // Add an event listener for SPACEBAR
            const handleKeyPress = (event) => {
                if (event.code === "Space") {
                    document.body.removeChild(popup); // Remove the popup
                    document.removeEventListener("keydown", handleKeyPress); // Remove the event listener
                    finalize_trial(); // Proceed to finalize the trial
                }
            };

            document.addEventListener("keydown", handleKeyPress);
        }

        // Function to make everything go fast
        function play_remaining_trial() {
            hyperSpeed = 10;
            display_element.removeChild(timer_display);
            update_trial();
            speedChange = true;
            speedChange = false;
            update_positions(hyperSpeed);
            let remainingTime = (trial.trial_duration - (performance.now() - start_time)) / 1000;
            const countdownInterval = setInterval(() => {
                remainingTime--;
                if (remainingTime <= 0) {
                    clearInterval(countdownInterval); // Stop the countdown
                    give_feedback();
                }
            }, 1000 / hyperSpeed); // Update faster
        }

        function give_feedback() {
            speedChange = true;
            update_positions(0);
            const popup = document.createElement("div");
            popup.id = "no-response-popup";
            popup.style.position = "fixed";
            popup.style.top = "10%";
            popup.style.left = "50%";
            popup.style.transform = "translate(-50%, -50%)";
            popup.style.zIndex = "1000";
            popup.style.padding = "20px";
            popup.style.backgroundColor = "white";
            popup.style.border = "2px solid black";
            popup.style.textAlign = "center";

            if (trial.is_practice == true) {
                let answer;
                let shouldBe;
                let feedback;
                if (Math.abs(trial.effect_size - 0) <= 0.01) {
                    answer = "the Harmony Hive"
                    shouldBe = "same";
                } else {
                    answer = "the Chaotic Hive"
                    shouldBe = "different";
                }
                if (response == shouldBe) {
                    feedback = "Correct";
                } else {
                    feedback = "Incorrect";
                }
                // Add message to the popup
                const message = document.createElement("p");
                message.textContent = feedback + "! The correct answer was: " + answer;
                popup.appendChild(message);
                document.body.appendChild(popup);
                setTimeout(() => {document.body.removeChild(popup);}, 3000);
            }

            if (trial.nudge == 1) {
                setTimeout(showOptimal, 3000);
            } else {
                setTimeout(finalize_trial, 3000);
            }
        }

        // Function to show optimality plot
        function showOptimal() {
            const optPop = document.createElement("div");
            optPop.id = "no-response-popup";
            optPop.style.position = "fixed";
            optPop.style.top = "10%";
            optPop.style.left = "50%";
            optPop.style.transform = "translate(-50%, -50%)";
            optPop.style.zIndex = "1000";
            optPop.style.padding = "20px";
            optPop.style.backgroundColor = "white";
            optPop.style.border = "2px solid black";
            optPop.style.textAlign = "center";

            const message = document.createElement("p");
            message.textContent = "Did you answer at the optimal time? The graph below shows the true distribution of orange and blue bees. Was this hive a chaotic or a harmonic one? Check the graph below, then press the space bar when you are ready to continue.";
            optPop.appendChild(message);

            const graphDiv = document.createElement("div");
            graphDiv.style.position = "absolute";
            graphDiv.style.top = "30%"
            graphDiv.style.left = "30%"
            graphDiv.style.width = "40%"
            graphDiv.style.height = "auto";
            graphDiv.style.aspectRatio = "21/12"

            const graph = document.createElement("img");
            graph.src = 'img/' + effect_name + '.jpg';
            graph.style.position = "absolute";
            graph.style.width = '100%';
            graph.style.height = '100%';
            graphDiv.appendChild(graph);

            let rt_x_pos = 10.43 + (trial_rt / 12000) * 88.14;

            const line = document.createElement("div");
            line.style.position = "absolute";
            line.style.borderLeft = '4px solid #F50FC7';
            line.style.height = "75.5%";
            line.style.left = rt_x_pos + "%";
            line.style.top = "10.25%";
            graphDiv.appendChild(line);
            document.body.appendChild(optPop);
            document.body.appendChild(graphDiv);

            const spacePress = (event) => {
                if (event.code === "Space") {
                    document.body.removeChild(optPop); // Remove the popup
                    document.body.removeChild(graphDiv);
                    document.removeEventListener("keydown", spacePress); // Remove the event listener
                    finalize_trial(); // Proceed to finalize the trial
                }
            };

            document.addEventListener("keydown", spacePress);
        }

        
        // Function to finalize the trial
        function finalize_trial() {
            if (hyperSpeed != 1) {
                hyperSpeed = 1;
                speedChange = false;
                
            } else {
                display_element.removeChild(timer_display); // Remove the timer display
            }
        
            // If the participant didn't respond, mark the response as "null"
            if (response === null) {
                response = "null";
                var finish_bin = "null";
            }

            // Determine if the participant's response was correct
            if ((response === "same" && (trial.effect_size === 0 || trial.effect_size === 0.01 || trial.effect_size === -0.01)) || 
            (response === "different" && (trial.effect_size === 0.03 || trial.effect_size === -0.03 || trial.effect_size === 0.02 || trial.effect_size === -0.02))) {
                correct = true;
            }
            
            if (response != "null") {
                var finish_bin = 1 + Math.floor(trial_rt / trial.interval_duration);
            }
            
            // Collect trial data
            var trial_data = {
                effect_size: trial.effect_size,
                trial_duration: trial_rt,
                blue_counts, orange_counts, response, correct, remaining_points, finish_bin
            };
        
            display_element.innerHTML = ''; // Clear the display element
            jsPsych.finishTrial(trial_data); // End the trial and pass data to jsPsych
        }
        

        // Set a timeout to automatically end the trial after the specified duration
        jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);

        // Listen for keypresses to record participant responses
        document.addEventListener('keydown', function(event) {
            if (event.repeat) {return};
            if (event.code === 'KeyQ') { // If "Q" key is pressed, participant thinks the beehive is "equal/same"
                response = "same";
                end_trial();
            } else if (event.code === 'KeyP') { // If "P" key is pressed, participant thinks the beehive is "unequal/different"
                response = "different";
                end_trial();
            }
        });

        update_trial(); // Start the process of updating the trial (adding dots)
        update_positions(1); // Start updating the positions of the dots
    };

    return plugin; // Return the plugin object to jsPsych
})();