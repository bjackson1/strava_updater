var https = require('https')
var request = require('request')
var fs = require('fs');
var process = require('process')

var accessTokenFile = process.env.HOME + '/strava_access_token'
var startTime = (((new Date).getTime() / 1000) - 7200).toFixed(0);

fs.readFile(accessTokenFile, 'utf8', function(err,data){
    if (err) {
        return console.log(err);
    }
    getActivities(data.trim());});

function getActivities(accessToken, callback)
{
    console.log('requesting...');
    return https.get(
        {
            host: 'www.strava.com',
            path: '/api/v3/athlete/activities?after=' + startTime + '&access_token=' + accessToken + '&per_page=100'
        }, function(response)
        {
            var body = '';
            response.on('data', function(d)
                {
                    body += d;
                });
            response.on('end', function()
            {
                var parsed = JSON.parse(body);
                var matchingActivities = [];
                for(var i = 0; i < parsed.length; i++)
                {
                    if (checkActivity(parsed[i]))
                    {
                        matchingActivities.push(parsed[i]);
                    }
                }
                
                for(var i = 0; i < matchingActivities.length; i++)
                {
                    console.log('Found activity:', matchingActivities[i].id, matchingActivities[i].private, matchingActivities[i].name, matchingActivities[i].distance);
                    makeActivityPrivate(matchingActivities[i], accessToken);
                }
            });
        });
}

function checkActivity(activity)
{   
    if (activity.distance < 30000 && !activity.private)
    {
        return true;
    }
    
    return false;
}

function makeActivityPrivate(activity, accessToken)
{
    var url = 'https://www.strava.com/api/v3/activities/' + activity.id + '?private=true&access_token=' + accessToken;
    request({ url: url, method: 'PUT', json: {}}, function(error, response, body){
        console.log('Update status:', response.statusCode);
    });
}
