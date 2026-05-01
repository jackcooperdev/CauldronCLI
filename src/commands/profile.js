// noinspection JSUnresolvedReference

const {Command} = require('commander');
const {search, select, input, confirm} = require("@inquirer/prompts");
const {cauldronLogger} = require("@jackcooperdev/cauldronengine/logger");
const {checkManifest, whatIsThis} = require("@jackcooperdev/cauldronengine/manifest");
const {sendToServer} = require("../utils/apiCommunication");
const {downloadProfiles, getProfiles} = require("../libs/profileManager");
const {addMod} = require("../libs/modManager");
const {logout} = require("../libs/authentication");
const {getAuthedUsers} = require("../libs/minecraft-auth");
const {createOutput} = require("../utils/output");
// No need for fs or path modules since we're fetching from a URL

// Define the URL to your version manifest file
const VERSION_MANIFEST_URL = 'https://resources.cauldronmc.com/version_manifest.json';
const RESOURCES_PATH = "https://resources.cauldronmc.com";
module.exports = {
    create_profile: new Command('create_profile')
        .description("Create a Profile")
        .option('-v, --version <type>', 'Minecraft Version', undefined)
        .option('-l, --mc_loader <type>', 'Minecraft Loader', undefined)
        .option('-t, --name <type>', 'Profile Name', undefined)
        .option('-b, --boot', 'Boot On Creation', false)
        .option('-d, --debug', 'output extra debugging information')
        .option('-n, --headless', 'Skip Interactive Elements')
        .action(async (options) => {
            let headless = options.headless;
            const out = createOutput(options.headless);
            if (options.debug) {
                cauldronLogger.level = 4;
            }
            const loaders = await checkManifest("cauldron_supported_loaders.json", `${RESOURCES_PATH}/supported_loaders.json`, "main");
            let loaderAnswer;
            console.log(options)
            if (options.mc_loader && loaders.includes(options.mc_loader) || headless) {
                loaderAnswer = options.mc_loader;
                if (!loaderAnswer) {
                    if (headless) {
                        out.error('Loader Required')
                    } else {
                        console.log('You need to provide a loader');
                    }
                    return;
                }
            } else {
                loaders.push("Exit");
                loaderAnswer = await select({
                    message: 'Select a Loader',
                    choices: loaders
                });
            }
            if (loaderAnswer === "Exit") {
                process.exit(0);
            }
            let versionsData = [];
            try {
                let manifestURL = `${RESOURCES_PATH}/version_manifest.json`
                let manifestName = `cauldron_version_manifest.json`

                if (loaderAnswer !== "vanilla") {
                    manifestURL = `${RESOURCES_PATH}/loaders/${loaderAnswer}/version_manifest.json`
                    manifestName = `cauldron_${loaderAnswer}_version_manifest.json`
                }
                cauldronLogger.debug(`Fetching version manifest from ${manifestURL}`);
                const response = await checkManifest(manifestName, `${manifestURL}`, "main");

                const data = await response;
                // Ensure 'versions' array exists in the fetched data
                if (data && Array.isArray(data.versions)) {
                    versionsData = data.versions;
                    cauldronLogger.debug(`Loaded ${versionsData.length} versions from manifest.`);
                }
                let answer;
                if (options.version || headless) {
                    answer = options.version;
                    if (!answer) {
                        if (headless) {
                            out.error('Version Required')
                        } else {
                            console.log('You need to provide a version');
                        }
                        return;
                    }
                } else {
                    answer = await search({
                        message: 'Search for a version ID:',
                        source: async (input, {signal}) => { // `signal` is not directly used here but kept for API consistency
                            if (!input) {
                                // If no input, return all versions or a limited set
                                return versionsData.slice(0, 20).map(version => ({
                                    name: version.id, // Display the ID
                                    value: `${version.id}`, // Return the ID as the value
                                    description: `Type: ${version.type}` // Add more detail
                                }));
                            }

                            const lowerInput = input.toLowerCase();
                            const filteredVersions = versionsData.filter(version =>
                                version.id.toLowerCase().includes(lowerInput)
                            ).slice(0, 20); // Limit results to 20

                            return filteredVersions.map(version => ({
                                name: version.id,
                                value: version.id,
                                description: `Type: ${version.type}`
                            }));
                        },
                    });
                }
                //You can use 'answer' here after the user makes a selection
                cauldronLogger.info('Selected version ID:', answer);
                cauldronLogger.info('Selected Loader:', loaderAnswer);
                answer = await whatIsThis(answer, response);
                const foundVersionData = data.versions.find((version) => version.id === answer);
                if (!foundVersionData) {
                    cauldronLogger.error('Invalid Version / Loader Combo')
                    process.exit(0)
                }
                // If Here Version / Loader is valid
                let getName;

                if (options.name || headless) {
                    getName = options.name
                    if (!getName) {
                        if (headless) {
                            out.error('Name Required')
                        } else {
                            console.log('You need to provide a name');
                        }
                        return;
                    }
                } else {
                    getName = await input({message: "Enter Name of Profile:"});
                }

                // Create Obj for creation

                let newProfile = {
                    "name": getName,
                    version: answer,
                    loader: loaderAnswer,
                    isModded: false,
                    modpackInfo: {provider: 'custom', mods: []}
                }

                if (loaderAnswer !== "vanilla" && !options.headless) {
                    newProfile.isModded = true;
                    let mods = [];
                    let addAnotherMod = false;
                    addAnotherMod = await confirm({message: "Would you like to add a mod?"})
                    if (addAnotherMod) {
                        while (addAnotherMod) {
                            let newMod = await addMod();
                            let newModObj = {
                                source: 'cf',
                                slug: newMod,
                            }
                            mods.push(newModObj);
                            addAnotherMod = await confirm({message: "Would you like to add another mod?"})
                        }
                    }
                    newProfile.modpackInfo.mods = mods;
                } else if (loaderAnswer !== "vanilla" && options.headless) {
                    newProfile.isModded = true;
                }

                let sendData = {
                    method: 'post',
                    url: 'profile',
                    data: JSON.stringify(newProfile),
                }

                const result = await sendToServer(sendData, true);
                let packID = result.profile._id;
                cauldronLogger.info("Pack Created!")
                if (headless) {
                    out.success({id:packID})
                }
                await downloadProfiles();
                if (options.boot) {
                    // Boot Profile TODO (requires split launch to lib)
                } else {
                    process.exit(0)
                }


            } catch (error) {
                cauldronLogger.error(`Error fetching or parsing version manifest from ${error}:`);
                // Exit or handle the error gracefully if the manifest is crucial
                process.exit(0);
            }
        }),

    add_mods: new Command('add_mods')
        .description("Add Mods To Profile")
        .option('-p, --profile <type>', 'Minecraft Version', undefined)
        .option('-m, --mods <type>', 'List of mods (CSV)', undefined)
        .option('-n, --headless', 'Skip Interactive Elements')
        .option('-d, --debug', 'output extra debugging information')
        .action(async (options) => {
            let headless = options.headless;
            const out = createOutput(headless);
            await downloadProfiles();
            let profiles = await getProfiles();
            let profileOptions = [];
            let answer;
            if (!options.profile &&  !options.headless) {
                for (let idx in profiles) {
                    if (profiles[idx].isModded) {
                        profileOptions.push({
                            "name": `${profiles[idx].profileName} (${profiles[idx].options.version}-${profiles[idx].options.loader})`,
                            "value": profiles[idx]
                        })
                    }
                }

                profileOptions.push({"name": "Exit", value: false})
                answer = await select({
                    message: 'Select a Profile to launch',
                    choices: profileOptions
                });
            } else {
                if (!options.profile) {
                    if (headless) {
                        out.error('Profile Required')
                    } else {
                        console.log('You need to provide a profile');
                    }
                    return;
                }
                for (let idx in profiles) {
                    if (profiles[idx]._id === options.profile) {
                        answer = profiles[idx]

                    }
                }
            }

            let mods = [];

            if (!options.headless) {
                let addAnotherMod = false;
                addAnotherMod = await confirm({message: "Would you like to add a mod?"})
                if (addAnotherMod) {
                    while (addAnotherMod) {
                        let newMod = await addMod();
                        let newModObj = {
                            source: 'cf',
                            slug: newMod,
                        }
                        mods.push(newModObj);
                        addAnotherMod = await confirm({message: "Would you like to add another mod?"})
                    }
                }
            } else {
                if (!options.mods) {
                    if (headless) {
                        out.error('Mods Required')
                    } else {
                        console.log('You need to provide a mod list');
                    }
                    return;
                }
                mods = []
                let modList = options.mods.split(",")
                for (let idx in modList) {
                    let sendData = {
                        method: 'get',
                        url: `modpack/curse-lookup?knownSlug=${modList[idx].toLowerCase()}&version=${answer.options.version}`,
                    }

                    const result = await sendToServer(sendData, true);
                    console.log(answer.options.version);
                    console.log(modList[idx]);
                    if (result.isCompatible || result.includes("modrinth")) {
                        let nm = {
                            slug: modList[idx],
                            source: 'cf',
                        }
                        mods.push(nm);
                    }
                }
            }



            let modifedifiedPayload = {
                mods: mods
            }
            let sendData = {
                method: 'put',
                url: 'profile?_id=' + answer._id,
                data: JSON.stringify(modifedifiedPayload),
            }


            await sendToServer(sendData, true);

            cauldronLogger.info('Pack Updated Successfully')
            process.exit(0)


        }),

    search_mods: new Command('search')
        .description("Add Mods To Profile")
        .requiredOption('-q, --query <query...>', 'Search Query')
        .requiredOption('-l, --loader <loader>', 'Loader')
        .requiredOption('-v, --version <version>', 'Version')
        .option('-n, --headless', 'Skip Interactive Elements')
        .option('-d, --debug', 'output extra debugging information')
        .action(async (options) => {
            let headless = options.headless;
            if (headless) {
                const out = createOutput(headless);
                try {
                    options.query = options.query.join(" ");
                    console.log(options.query)
                    if (options.query.length >= 3) {
                        let queryResponse = await addMod(options.loader,options.version,options.query,headless);
                        out.data(queryResponse)
                    } else {
                        out.data([])
                    }

                } catch (e) {
                    console.error(e);
                    out.error(e);
                }
            }

        }),

    share: new Command('share')
        .description('Logout from CauldronAPI')
        .requiredOption('-u, --user <type>', 'User to share with')
        .option('-p, --profile <type>', 'Profile To Share')
        .option('-n, --headless', 'Skip Interactive Elements')
        .action(async (options) => {
            await downloadProfiles();
            let profiles = await getProfiles();
            let profileOptions = [];
            let answer;
            if (!options.profile) {
                for (let idx in profiles) {
                        profileOptions.push({
                            "name": `${profiles[idx].profileName} (${profiles[idx].options.version}-${profiles[idx].options.loader})`,
                            "value": profiles[idx]
                        })
                }

                profileOptions.push({"name": "Exit", value: false})
                answer = await select({
                    message: 'Select a Profile to launch',
                    choices: profileOptions
                });
            } else {
                for (let idx in profiles) {
                    if (profiles[idx]._id === options.profile) {
                        answer = profiles[idx]
                    }
                }
            }

            let shareBody = {
                profile:answer._id,
                users: [options.user]
            }

            let sendData = {
                method: 'post',
                url: 'social/share',
                data: JSON.stringify(shareBody),
            }

            await sendToServer(sendData, true);

            cauldronLogger.info('Pack Shared Successfully')
            process.exit(0)

        }),

    list_profiles: new Command('list_profiles')
        .option('-n, --headless', 'Skip Interactive Elements')
        .option('-d, --debug', 'output extra debugging information')
        .description('List Minecraft Profiles')
        .action(async (options) => {
            const out = createOutput(options.headless);
            await downloadProfiles();
            let profiles = await getProfiles();
            if (options.headless) {
                out.data(profiles)
            } else {
                console.log(profiles);
            }
        }),
};