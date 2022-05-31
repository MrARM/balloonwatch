// Sonde updates - periodically update the sonde position, altitude, landing time and location while the last recieved packet is still below 1 hour.

/*
 * Dev notes - will be cleaned prior to merge
 * When a new sonde is detected, we will provide a hook to the new sonde message post
 *   - Decode the sonde ID, grab the discord message ID, grab a timestamp
 * Whenever a known sonde is detected, we'll also hook there
 *   - Update the sonde and add the last known position, last known altitude and the time received
 * In the init hook, we'll grab and store the mongo db and set a 15-second interval which checks each sonde in the DB and does the following:
 *   - If the sonde is older than 1 hour, delete the record
 *   - Run a prediction on every sonde in the database (Pools all numbers to run a batch check)
 *     - After this is done, update the known sondes on discord with a new formatted message.
 */
