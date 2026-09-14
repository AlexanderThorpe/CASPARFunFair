# Fun Fair

This repository contains code to run online experiments originally used in CASPAR's Fun Fair study. All code was written by Dr Kamilya Salibayeva, Dr Alexander Thorpe, and Dr Luke French. Contact alexander.thorpe@newcastle.edu.au

## Deployment 

The experiment code was written to be deployed on a JATOS server for online deployment. The first deployment was to JATOS v3.5.8, but the code has been tested and works on v3.9.8.
In the JATOS project associated with this experiment, each HTML file should have a corresponding component, for a total of 12 components.
The experimental flow depends on the correct ordering of these components. Components should be ordered in the following way:

1. check.html
2. landing.html
3. cards_stage3.html
4. cases_stage3.html
5. ducks_stage3.html
6. lottery_gf_stage3.html
7. marbles_stage3.html
8. slots_stage3.html
9. wason_stage3.html
10. words_mee_stage3.html
11. trivia_stage3.html
12. end.html

URL query parameters are used to collect participant IDs and cohort membership. The first component, check.html, looks for the parameter _survey_code_ for a SONA ID, Prolific PID, or other username.
It also looks for the cohort parameter _pop_, to be used for redirecting back to SONA, Prolific, etc. This redirect occurs in end.html, so redirect links and appropriate _pop_ parameter values can be written here.
