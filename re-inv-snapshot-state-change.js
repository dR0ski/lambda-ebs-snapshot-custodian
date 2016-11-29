var AWS = require('aws-sdk');
var util = require('util');
AWS.config.update({region: 'us-west-2'});

exports.handler = (event, context, callback) => {
    // TODO implement
    
//Variable Declaration for AWS API Libraries
var ec2 = new AWS.EC2({apiVersion: 'latest'});
var dynoClient = new AWS.DynamoDB.DocumentClient({region: 'us-west-2'});


var params = {
	TableName: 'Snaps',
};

dynoClient.scan(params, function(err, data) {
	if (err) console.log(err); // an error occurred
	else {
		
		data.Items.forEach(function(snapitem) {
			
			var id = snapitem.SnapshotId;
			var snapState = snapitem.State;
			//console.log(snapState);
			
			var ebsparams = {
				
				SnapshotIds: [ snapitem.SnapshotId
				]
			};
			
			//console.log(ebsparams);
				
							ec2.describeSnapshots(ebsparams, function(err, data) {
							if (err){ 
								console.log(err, err.stack);
										} // an error occurred
										else     
										{
											var volume = Object.keys(data);
											volume.forEach(function(volume) {
											var items = Object.keys(data[volume]);
											items.forEach(function(item) {
												var value = data[volume][item];
											
											 
											var state = value.State 
											var snapIds = value.SnapshotId
											//console.log(value);
													
													if ((state == 'completed' && snapState == 'pending'))
													{
														
														var updateparams = {
															TableName: 'Snaps',
															Key:{
																
																"SnapshotId": snapIds
																
															},
															UpdateExpression: "SET #estate =:s",
															ExpressionAttributeNames:{
																"#estate": "State"
																
															},
															
															ExpressionAttributeValues: { 
																":s": state
															    },
																
																
															ReturnValues:"UPDATED_NEW"
														};

														//console.log("Updating the item...   " + snapIds );
														dynoClient.update(updateparams, function(err, data) {
															if (err) {
																console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
															} else {
																console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
															}
														});
														
														//console.log(snapIds + "    has a status of   " + state);
														
													} //closes if statement
													
													else {
													console.log("Nothing to Update!");	
													// write some condition 
													
													} //closes else statement 
											
											
											
											}); //Closes the "volume.forEach(function(volume) { " function
											}); //Closes the "items.forEach(function(item) { " function
											}   //Closes the second else statement         
											
											}); //Closes the ec2.describeSnapshots(ebsparams, function(err, data) {
					
			
		}); //Closes the "data.Items.forEach(function(snapitem) {" fucntion
		
		} // Closes the first else statement 
		
}); //Closes the "dynoClient.scan(params, function(err, data) {" function

    
    
    
    callback(null, 'Hello from Lambda');
};