const {search} = require("@inquirer/prompts");
const {grabAccessToken} = require("./authentication");
const {grabServerAddress} = require("../utils/enviromentManager");

async function addMod() {
    return new Promise(async (resolve, reject) => {
        try {
            const answer = await search({
                message: 'Search for a mod on curseforge',
                source: async (input, { signal }) => {
                    if (!input || input.length < 3) {
                        return [];
                    }

                    const response = await fetch(

                        `${grabServerAddress(true)}modpack/curse-search?query=${encodeURIComponent(input)}&version=1.7.10&loader=forge&size=10`,
                        {
                            method: 'GET', // Often good practice to explicitly state the method
                            signal,
                            headers: {
                                'Content-Type': 'application/json', // Common header
                                'Authorization': `Bearer ${await grabAccessToken()}` // Example: an Authorization header
                                // Add any other headers you need here
                            },
                        },
                    );
                    const data = await response.json();

                    return data.map((pkg) => ({
                        name: pkg.name,
                        value: pkg.value,
                        description: pkg.description,
                    }));
                },
            });
            resolve(answer);
        } catch (e) {
            reject(e);
        }

    })

}



module.exports = {addMod}