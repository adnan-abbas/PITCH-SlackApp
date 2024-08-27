const morningBlock = 
          [
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Update Morning Time",
                "emoji": true
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Set your new morning check-in time by selecting a time on the right"
              },
              "accessory": {
                "type": "timepicker",
                "initial_time": "09:00",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select time",
                  "emoji": true
                },
                "action_id": "timepicker-action"
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Do you want the chatbot to check-in at a random minute in the one hour window? For example, if you selected 9:00AM and select Yes below the chatbot will check-in at random time between 9:00AM and 10:00AM."
              },
              "accessory": {
                "type": "radio_buttons",
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Yes",
                      "emoji": true
                    },
                    "value": "value-0"
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "No",
                      "emoji": true
                    },
                    "value": "value-1"
                  }
                ],
                "action_id": "radio_buttons-action"
              }
            }
          ];
          await say({
            blocks: morningBlock
          })
        } else if( words[0] === "set" && words[1]=== "evening") {
          const eveningBlock = [
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Update Evening Time",
                "emoji": true
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Set your new evening check-in time by selecting a time on the right"
              },
              "accessory": {
                "type": "timepicker",
                "initial_time": "17:00",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select time",
                  "emoji": true
                },
                "action_id": "timepicker-action"
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Do you want the chatbot to check-in at a random minute in the one hour window? For example, if you selected 5:00PM and select Yes below the chatbot will check-in at random time between 5:00PM and 6:00PM."
              },
              "accessory": {
                "type": "radio_buttons",
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Yes",
                      "emoji": true
                    },
                    "value": "value-0"
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "No",
                      "emoji": true
                    },
                    "value": "value-1"
                  }
                ],
                "action_id": "radio_buttons-action"
              }
            }
          ];
          await say({
            blocks:eveningBlock
          });
        }




        const scheduleEveningMessages = async (app) => {
          await userUpdate("U06BE7BQRQS", "08:00", "19:00");
          users = await getAllUsers();
          users.forEach(async  (user) => {
            const [hour, minute] = user.eveningTime.split(':');
          
            console.log(user.userName, user.eveningTime);
            const randomMinute = Math.floor(Math.random() * 60);
            var reminderHour = parseInt(hour,10);
            //console.log("random evening minute is", randomMinute);
            cron.schedule(`0 ${randomMinute} ${hour} * * *`, async () => {
              await initializeEveningBot(user.userId);
              const response = await getEveningAIResponse(user.userId, 'Begin conversation. Start by a greeting.')
              await sendMessage(app, user.userId, response);
              });
            const eveningMinute = parseInt(minute, 10);
            var reminderMinute = randomMinute + 15;
            if (reminderMinute >= 60) {
              reminderHour += 1;
              reminderMinute -= 60;
            }
        
            cron.schedule(`${reminderMinute} ${reminderHour} * * *`, async () => {
              const surveyBlockMessage = [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "Survey Form 📝",
                    "emoji": true
                  }
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Please fill out this survey by clicking the button when you have a moment."
                  },
                  "accessory": {
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "text": "Click Me",
                      "emoji": true
                    },
                    "value": "click_me_123",
                    "url": dailySurveyLink,
                    "action_id": "button-action"
                  }
                }
              ]
              await sendSurveyMessage(app, user.userId, surveyBlockMessage);
            });
        
          });
        };





        'help this worker identify what their core values at work are.',
      'help this worker understand how they can change behaviors for productivity.',
      'help this worker be more organized in their task management.',
      'help this worker recognize good habits that they want to establish for their productivity.',
      'help this worker change their perception of themselves for their mental health.', 
      'help this worker be compassionate to themselves at work.',
      'help this worker understand how they can change behaviors for mental well-being.', 
      'help this worker accomplish a good work-life balance.'