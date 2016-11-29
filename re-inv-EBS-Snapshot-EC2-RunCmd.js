var AWS = require('aws-sdk');
var util = require('util');

AWS.config.update({region: 'us-west-2'});
var ssm = new AWS.SSM();

//Variable Declaration for AWS API Libraries
var ec2 = new AWS.EC2({apiVersion: 'latest'});
const dynDB = new AWS.DynamoDB.DocumentClient({region: 'us-west-2'});


var string;
var num = 0;
var idcount = 0;
var ins;
var Id = [];
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

//Defines a parameter that contains a filter for a specific Tag. In this case the value of the Tag is 'snapshot'. 
//It can, however, be what ever you want it to be 
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
				
				//"group" is a variable that stores the attributes of the Instances that are returned
				var group = instances[instance];
				
				
				//"rootdev" is used to grab the root device information. 
				//"groot" is an array that is used to store each root device information
				var rootdev = instances[instance].RootDeviceName;
				groot.push(rootdev);
				
			
				//Commence parsing the attributes of the instance
				var dat = JSON.stringify(group, 2);
				var runner = JSON.parse(dat, (key, value)=>{
										
					
					//Grabs Instance-Id. This is used as a parameter in the EC2 Run Command Function
					if (key ==='InstanceId')
					{
						ins = value.toString();
						
					} //End if : 1
					
					//Grabs the DeviceName of the Volumes attaced to the EC2 Instances. Used in a for loop to check if its a Root Device. 
					//Root Devices are not Snapshot in this Lambda F(n).
					if (key ==='DeviceName')
					{
						ace = value.toString();
						i.push(ace);
					
					}//End if : 2
					
					if(key === 'VolumeId')
					{
						vol = value.toString();
						a.push(vol);
						icount++;
								
					} //End if : 3
					
					if(key === 'Key')
					{
						tagz = value.toString();
						
						
					}//End if : 4
					 
					
					if((key === 'Value') && (tagz === 'snaplifetime'))
					{
						
						b = Number(value);
						
						for (sol = 0; sol < icount; ++sol)
						{
						
								tag.push(b);
								Id.push(ins);
								
						}
						
						icount = 0;	
									
					} //Closes if((key === 'Value') && (tagz === 'snaplifetime'))
									
					
				}); //End of PARSING
				
		
		} //Closed the "for ( var instance in instances) {"
			
		
	} // Closes the "for( var item in response.data.Reservations) { "
	
	
	//Removing Duplicate Items from the Array "groot" 
	uniqueArray = groot.filter(function(elem, pos) {
		return groot.indexOf(elem) == pos;
	});
	
	//bp is an array that stores the root device name. This fucntion combines all the elements in the array into one string. 
	bp.push(uniqueArray.toString()) ;
	bp.join();
	
	//Stores the combined elements of the array in one single variable
	string = bp[0].toString();
	
	
	// Looping through array  "i" and filtering out Root Devices
	for (numsnaps = 0; numsnaps < i.length; ++numsnaps) {
		
		
			//Checks to see if the volume device name is a root device name. 
			if (string.includes(i[numsnaps].toString())){  mrkr = 0; }
				
			
			else { ++mrkr;  }
				
		//-------------------------------- Checks to see if the volume in play is the root volume, if not then a snapshot is initiated  ------------
			
		if (Number(mrkr) >= 1) {
			
			
			var vict = a[numsnaps].toString(); //
			var success = Id[numsnaps];
			
			
			
			var params = {
				VolumeId: vict,			
				DryRun: false
				};
		
			//---------------------------------------------------------------------------------------------------------------------------------------

			
			if (success ==='i-354a9fa0'){
			
			//------------------------  Amazon EC2 Run Command : Flush Page Cache on Linux Instances to Block Devices -------------------------------
			
			var runparams = {
				DocumentName: 'Linux-SSM-Doc', /* required */
				InstanceIds: [ /* required */
					success
					/* more items */
				],
				Comment: 'Flushes Linux PageCache to Block Devices', /* Please note that I have chosen to do a PageCache Flush but you can chose to stop writes and unmount the block devices as recommended by AWS. */
				DocumentHash: 'ebbeb08ac1bee5c25ae3d0a1392786ca05c003a73fc7b2251644e3e4571832d9', /* References an EC2 Document that has the command "sync; echo 3 > /proc/sys/vm/drop_caches" defined. */
				DocumentHashType: 'Sha256',
				NotificationConfig: {
					NotificationArn: 'arn:aws:sns:us-west-2:574463026149:SSM_Success',
					NotificationEvents: [
						'All'
						/* more items */
					],
					NotificationType: 'Command'
				},
				OutputS3BucketName: 'run-cmd-bucks',
				OutputS3KeyPrefix: 'run',
				ServiceRoleArn: 'arn:aws:iam::574463026149:role/SSM-Role',
				TimeoutSeconds: 3600
			};
			
			ssm.sendCommand(runparams, function(err, data) {
				if (err) console.log(err, err.stack); // an error occurred
				else     console.log(data);           // successful response
			});
			
			//-------------------------------------------------------------------------------------------------------------------------------------------
			
			
			}
			//Uses the VolumeId stored in the "vict" variable to create snapshots
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
					
					TableName: 'Snaps' //Snaps is the name a DynamoDB Table that I created. You can however create your own table and call it whatever you want like Ninja! , No, seriously, you can call it Ninja :)
					
										
					}; //Closes "vparams"
					
					//Writes Snapshot Attirbutes to a DynamoDB Table "Snaps"
					dynDB.put(vparams, function(err, data) 
					
					{
						if (err) console.log(err, err.stack); // an error occurred
						else { console.log('Successful Write!'); }

											
					}); //Closes DynamoDB PUT Call
				
					

				} // Closes the ELSE
				
			

				}); //Closes EC2.CreateSnapshot Function
				

			
				} //Closes if (Number(mrkr) >= 1) Function
		
	
		
				} // Closes for (numsnaps = 0; numsnaps < i.length; ++numsnaps) Function 
		
			
			//console.dir();
				

			
  }). // ON.Request Function (Very First Function)


  on('error', function(response) {
    console.log("Error!");
  }).

send();