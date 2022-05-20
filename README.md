# BalloonWatch - A program to notify a group when a balloon launches nearby

## Setup
**Set the following environment variables to configure the system**

*An asterisk(&ast;) notates a required variable to start the program*

| Variable        	 | Description 	                                                      |
|-------------------|--------------------------------------------------------------------|
| `DISCORD_TOKEN`   | Discord bot token                                                  ||
| `DISCORD_CHANNEL` | Discord channel to post messages to                                |
| `MONGO_URI`&ast;  | MongoDB url to log seen balloons, defaults to localhost if not set |
**Configure config.json as necessary, it will be updated with git commits so please back up your local version before you `git pull`**

| Value    	            | Description 	                                                                                                                                                          |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **watch_polygon**     | A polygon to define the area to detect radiosondes, if a radiosonde enters this area, a launch event will be triggered.                                                |
| **usual_hours**       | A list of UTC hours of which a usual launch occurs. It is recommended to also add 1-2 hours after a normal launch in case there is a low receiver density.             |
| **pre_launch_offset** | Time in minutes to not flag a launch as unusual as defined by **usual_hours**. E.g. some stations may pick up the sonde from the ground before launch. (Not used yet!) |

