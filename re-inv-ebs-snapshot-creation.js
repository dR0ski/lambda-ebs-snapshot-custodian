var AWS = require('aws-sdk');
var util = require('util');


//Variable Declaration for AWS API Libraries
var ec2 = new AWS.EC2({apiVersion: 'latest'});
const dynDB = new AWS.DynamoDB.DocumentClient({region: 'us-west-2'});

var icount = 0;
var op = 0;
var bp =[];
var tnum= -1;
var ace;
var snaps = [];
var vol;
var vparams;
var b=0;
var tagz;
var tag = [];
var uniqueArray = [];
var mrkr = 0;


var param = { Filters: [ { Name: 'tag-value', Values: ['snapshot'] } ] };
				
				
var request = ec2.describeInstances(param);

//array to hold object variables for param 
var snapshots = [];
var i = [];
var a = [];
var groot = [];
var glob = [];


request.on('success', function(response) {
   

 
	for( var item in response.data.Reservations) {  	
		var instances = response.data.Reservations[item].Instances;
		
		
		for ( var instance in instances) {
			
	
				var group = instances[instance];
				
				var rootdev = instances[instance].RootDeviceName;
				groot.push(rootdev);
			
				
				var dat = JSON.stringify(group, 2);
				
				 var runner = JSON.parse(dat, (key, value)=>{
										
					
					
					if (key ==='DeviceName')
					{
						ace = value.toString();
						i.push(ace);
					}
					
					if(key === 'VolumeId')
					{
						vol = value.toString();
						a.push(vol);
						icount++;		
					} 
					
					if(key === 'Key')
					{
						tagz = value.toString();
						
						
					}
					 
					
					if((key === 'Value') && (tagz === 'snaplifetime'))
					{
						
						b = Number(value);
						
						for (sol = 0; sol < icount; ++sol)
						{
						
								tag.push(b);
							
						}
						
						icount = 0;	
									
					} //Closes if((key === 'Value') && (tagz === 'snaplifetime'))
					
				
					
				}); //End of PARSING
				
		
		}
			
		
	}
	
	
	//Removing Duplicate Items from the Array "groot" 
	uniqueArray = groot.filter(function(elem, pos) {
		return groot.indexOf(elem) == pos;
	});
	
	
	bp.push(uniqueArray.toString()) ;
	bp.join();
	//console.log(bp);
	
	
	
	
	// Looping through array "a" and  "i" and filtering out Root Devices
	for (numsnaps = 0; numsnaps < i.length; ++numsnaps) {
		
		
			
			if (bp[0].includes(i[numsnaps].toString())){
				
				mrkr = 0;
				
			}
			
			else { 
				
				++mrkr; 
							
			}
			
		
		if (Number(mrkr) >= 1) {
					
			var vict = a[numsnaps].toString();
			
			
			var params = {
				VolumeId: vict,			
				DryRun: false
				};
		
			
			ec2.createSnapshot(params, function(err, data) {
						
			if (err) console.log(err, err.stack); // an error occurred
			else { // successful response
					tnum = tnum+1;
					op = Number(tag[tnum]);				
				 vparams = {
					
					Item: {
					
					SnapshotId: data.SnapshotId,
					VolumeId: data.VolumeId,
					State: data.State,
					StartTime: data.StartTime,
					OwnerId: data.OwnerId,
					VolumeSize: data.VolumeSize,
					Tags: data.Tags,
					Encrypted: data.Encrypted,
					Date: Date.now(),
					day: op
					
					
					
					},
					
					TableName: 'Snaps'
					
					
					}; //Closes VPARAMS
					
					dynDB.put(vparams, function(err, data) {
						if (err) console.log(err, err.stack); // an error occurred
						else { console.log('Successful Write!'); }

											
				}); //Closes DynamoDB PUT Call
				
					

				} // Closes the ELSE
				
				
				

				}); //Closes EC2.CreateSnapshot Function
				


			
				} //Closes if (Number(mrkr) >= 1) Function
		
	
		
				} // Closes for (numsnaps = 0; numsnaps < i.length; ++numsnaps) Function 
		
			
			//console.dir(tag);
				

			
  }). // ON.Request Function (Very First Function)


  on('error', function(response) {
    console.log("Error!");
  }).

send();