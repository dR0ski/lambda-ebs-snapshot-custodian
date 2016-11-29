# Complete EBS Life Cycle Management, from creating and deleting Snapshots.

------------------------------------------------------------------------------------------------------------------------------
Disclaimer: 

These scripts should be used as guidance for creating a complete EBS Life Cycle Management solution for your production environments. They should not be used in production with modification. 

------------------------------------------------------------------------------------------------------------------------------

This solution uses Amazon Lambda, EC2, CloudWatch Events and DynamoDB. When used together, these functions will 

A. Snapshot your EC2 Instances that has a specific Tag (I used a Tag name snapshot with a value of snapshot)

B. Write the Snapshot MetaData to DynamoDB

C. Update the Status field of the DynamoDB Table with the new status, for example from Pending to Completed

D. Lastly, Your Snapshots will be deleted after the number of day you specified for them to live. The lifetime is stored in the value of the Tag you created for this reason. In my code I added  the Tag "Snaplifetime" and a Value of "2" or "4" to my  EC2 instances. You are required to do this as well. Your Tag name and values can be what ever you want them to be. 

Instructions:

- Use Lambda to run your functions
- Leverage the schedule option in CloudWatch Events to schedule when your functions should run
- Create a Table in DynamoDB to store your Snapshot MetaData. This data is used to delete your Snapshots 
- Tag your Instances. You will need to add a Tag to your Instances that you would like to create Snapshots for. You will also - need to add a Tag to your Instance that specifies how long that Snapshot should live for

Amazon Web Services Services Used:

- Lambda
- DynamoDB
- Cloud Watch Events
- EC2 Run Command
- EBS


There are four Node.js files in this repository. 

1. reinv-ebs-snapshot-creation copy.js : 

Used to create a snapshot of an Amazon EBS Volume. This should be used as a base for building your Lmabda functions to achieve Snapshots according Amazon Best Practices. 

This Node.js script does an EC2 Describe Instance call and returns results base on a specified filter. The results are in JSON format. The JSON data is parsed and specific information like DeviceName, VolumeId, and Tags are retrieved. 

"reinv-ebs-snapshot-creation copy.js" is built to only create Snapshots of Non Root Volumes. Please note that I have built a modifies version of this script that allows you to run commands like "sync" on a Linux server before initiating a Snapshot. EC2 Run Command is used to accomplish this. 

Please note that you can leverage EC2 Run Command to take this a step further by flushing the Page Cache on the Linux machine and then un mount the volume Snapshot it and re mount to the instance. 

You must schedule this fucntion to run by creating a CloudWatch Event. This schedule can be whatever you want it to. Please note that there are default limits on the number of snapshots you can create, please ensure that your limits meet your needs. You can easily increase your limits by submitting a request to AWS. 


2. reinv-snapshot-state-change copy.js

Used to update the "State" field of the Table in DynamoDb with the state of the Snapshot after you have made the CreateSnapshot API call. 

You must Create a CloudWatch Event to schedule this function to run multiple times each day. During testing, I schedule this function run every hour. That, however, is overkill

3. reinv-delete-snapshot copy.js : 

This script is used to delete each created snapshot after a the period of time you specified. You must add a Tag to your EC2 Instance. The Tag Key can be whatever you want it to be, I used snaplifetime but you can chose to do something else. You must specify a value along with the Tag. The Value is the number of days you would like a Snapshot for this specific Instance to live. 

This function calculates the number of days that has passed since your snapshot was created. It then checks the "days" field in the DynamoDB Table against the length of time the snapshots been stored so far. If value in the "days" field is equal to or less than the calculated value, then the snapshot is deleted. 

You must schedule this function to run using CloudWatch Events. I generally run it once per day given that I am doing a scan on the DynamoDB table. 

BONUS SCRIPT! BONUS SCRIPT! BONUS SCRIPT! BONUS SCRIPT! BONUS SCRIPT!

4.  reinv-EBS-Snapshot-EC2-RunCmd copy.js

"reinv-EBS-Snapshot-EC2-RunCmd copy.js" is a modified version of "reinv-ebs-snapshot-creation copy.js ". It is important to note that "reinv-EBS-Snapshot-EC2-RunCmd copy.js" leverages Amazon EC2 Run Command to run shell scripts on the EC2 Instance that the Volumes are being snapshotted for. 

The shell script that I ran on my Linux Instances is "sync; echo 3 > /proc/sys/vm/drop_caches" but this could easily have been something far more complex. For example, if I was to write this shell script to achieve a Snapshot according to Amazon best practices then I would simply flush the caches to my block volumes and unmount the volumes then snapshot them and remount when I am finish. You can do this as well as a matter of fact I recommend that you do. Read more on Snapshoting EBS Volumes at "http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-creating-snapshot.html" and EC2 Run Commands at "http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/execute-remote-commands.html". 

Amazon EBS Recommendations for creating a Snapshot of an Instane:

" You can take a snapshot of an attached volume that is in use. However, snapshots only capture data that has been written to your Amazon EBS volume at the time the snapshot command is issued. This might exclude any data that has been cached by any applications or the operating system. If you can pause any file writes to the volume long enough to take a snapshot, your snapshot should be complete. However, if you can't pause all file writes to the volume, you should unmount the volume from within the instance, issue the snapshot command, and then remount the volume to ensure a consistent and complete snapshot. You can remount and use your volume while the snapshot status is pending.

To create a snapshot for Amazon EBS volumes that serve as root devices, you should stop the instance before taking the snapshot.

To unmount the volume in Linux, use the following command:

umount -d device_name
Where device_name is the device name (for example, /dev/sdh).

After you've created a snapshot, you can tag it to help you manage it later. "


