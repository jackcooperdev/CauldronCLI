


async function handlePing(param1,param2) {
    console.log('ping handled')
    console.log(param1)
    console.log(param2)
    return 'helloworld'
}


module.exports = {handlePing};