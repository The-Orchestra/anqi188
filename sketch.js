// ml5.js: Pose Estimation with PoseNet
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/Courses/ml5-beginners-guide/7.1-posenet.html
// https://youtu.be/OIo-DIOkNVg
// https://editor.p5js.org/codingtrain/sketches/ULA97pJXR

let video;
let poseNet;
let pose;
let skeleton;
let isFirstTime = true;
let song;
let gun;


function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  var context = new AudioContext();

  gun = new Pizzicato.Sound('https://www.mboxdrive.com/410399__erokia__30-30-lever-rifle-gunshot.mp3', function() {
    console.log('gun loaded');
  });
 
  document.querySelector('button').addEventListener('click', function() {
  context.resume().then(() => {
    //  song = new Pizzicato.Sound('https://foodadvisor.s3.us-east-2.amazonaws.com/song.wav', function() {
    song = new Pizzicato.Sound('https://www.mboxdrive.com/biisi.mp3', function() {
      // Sound loaded!
      console.log('Playback resumed successfully');
      song.play();
      console.log('PLAYING')
    });

  });
});
poseNet.on('pose', gotPoses);
}



let flag = 0;
let panflag = 1;
let ppdflag = 1;
function gotPoses(poses) {

  // Decide which part you want to track
  let leftShoulder = {}; 
  let rightWrist = {};

  
  if (poses.length > 0) {
    pose = poses[0].pose;

      // storing the y coordinates of the selected part in this variable
    let rW_x = Math.round(pose.rightWrist.x);
    let rW_y = Math.round(pose.rightWrist.y);

    let lW_x = Math.round(pose.leftWrist.x);
    let lW_y = Math.round(pose.leftWrist.y);

    var stereoPanner = new Pizzicato.Effects.StereoPanner({
      pan: 0.0
    });

    var pingPongDelay = new Pizzicato.Effects.PingPongDelay({
      // feedback: 0.6,
      // time: 0.4,
      // mix: 0.5
      feedback: 0.8,
      time: 0.8,
      mix: 0.8
    });


    skeleton = poses[0].skeleton;
    if (skeleton.length > 0) {
      skeleton[0].forEach(element => {

        // check if your selected part has been detected by the webcam
        if(element.part === 'leftShoulder') {
          leftShoulder = element;
          // console.log('leftShoulder ');
        }

        if(element.part === 'rightWrist') {
          rightWrist = element;
          console.log('rightWrist ');
        }
      });
    }


    /**********buffer of effect button
     **** flag 1,2,3 == volume, pan, dingdongdelay
    */
    if(rW_x>0 && rW_x<80) {
      if(rW_y>80 && rW_y<200){
        flag = 1;
        console.log("flag ", flag);
      } else if(rW_y>200 && rW_y<320) {
        flag = 2;
        console.log("flag ", flag);
      } else if(rW_y>320 && rW_y<440){
        flag = 3;
        console.log("flag ", flag);
      }
    }

    /**********buffer of gun shoting
     *** raise your right hand to touch the circle
     *** to trigger the gun shoting
    */
    if(rW_x>170 && rW_x<230) {
      if(rW_y>70 && rW_y<130)
        gun.play();
    }


    if('score' in leftShoulder) {

      /******** pan MANIPULATION *************
       *** this part still sound quite problematic
       *** the sound quality will dramatically decrease with pan effect
       *** and I cannot reset the pan to original mode
       * */
      console.log('leftShoulder MOVED ', leftShoulder)

      if(flag == 2){
        song.volume = 1;
        ppdflag = 1;
        
        // song.removeEffect(pingPongDelay);
        song.addEffect(stereoPanner);

        if(lW_x<300 && rW_x<300){
          if(panflag == 1){
            // var dif = Math.abs(lW_x-rW_x);
            // stereoPanner.pan = 1 - dif/200.0;
            stereoPanner.pan = 1;
            console.log("panleft", stereoPanner.pan);
          }
          panflag = 0;
        } else if(lW_x>340 && rW_x>340){
          if(panflag == 1){
            // var dif = Math.abs(lW_x-rW_x);
            // stereoPanner.pan = -1 + dif/200.0;
            stereoPanner.pan = -1;
            console.log("panright", stereoPanner.pan); 
          }
          panflag = 0;
        } else {
          if(panflag == 0)
            stereoPanner.pan = 0.1;
          console.log("pan reset", stereoPanner.pan);          
          panflag = 1;
        }
      } 
    }

    if(flag == 1) {
      stereoPanner.pan = 0.0;
      pingPongDelay.mix = 0.0;
      pingPongDelay.time = 0.0;
      pingPongDelay.feedback = 0.0;
      ppdflag = 1;


      console.log('volume_control ')
      let freq = Math.round(pose.leftWrist.y);
    
      // ******** VOLUME MANIPULATION *************
      
      volume = 1 - (freq-0)/(480-0) * (1-0) + 0
      console.log('VOLUME ', volume)
      if(song) {
        song.volume = volume;
      }
    }

    if(flag == 3) {
      song.volume = 1;
      stereoPanner.pan = 0.0;

      console.log('pingPongDelay ')
      let freq = Math.round(pose.leftWrist.y);
    
      // ******** pingPongDelay MANIPULATION *************
      
      volume = 1 - (freq-0)/(480-0) * (1-0) + 0
      console.log('pingPong  ', volume)
      if(song) {
        // pingPongDelay.time = volume*0.4;
        // pingPongDelay.feedback = volume*0.6;
        // pingPongDelay.mix = volume*0.5;
        if(ppdflag == 1)
          song.addEffect(pingPongDelay);
        ppdflag = 0;
        // song.removeEffect(pingPongDelay);
      }
    }

  }
}


function modelLoaded() {
  console.log('poseNet ready');
}

function draw() {
  /***********flip the video ***********
   *** meaning that x need to be transform
   *** x = 640 - x' 
   ***/
  push();
  translate(width,0);
  scale(-1, 1);
  image(video, 0, 0);
  pop();

  /***********flag is used for control the button 
   *** flag == 1 --> volume
   *** flag == 2 --> pan
   *** flag == 3 --> pingPongDelay
  */
  if(flag == 1){
    textSize(32);
    text('Volume', 10, 30);
    fill(0, 102, 153);
    text('Volume', 10, 60);
    fill(0, 102, 153, 51);
    text('Volume', 10, 90);
  }
  if(flag == 2){
    textSize(32);
    text('Pan', 10, 30);
    fill(0, 102, 153);
    text('Pan', 10, 60);
    fill(0, 102, 153, 51);
    text('Pan', 10, 90);
  }
  if(flag == 3){
    textSize(32);
    text('pingPongDelay', 10, 30);
    fill(0, 102, 153);
    text('pingPongDelay', 10, 60);
    fill(0, 102, 153, 51);
    text('pingPongDelay', 10, 90);
  }





  if (pose) {

    /*********location of buttons*/
    fill(230, 230, 250);
    ellipse(640-200,100,40);

    fill(240, 255, 255);
    rect(580,100,40,80);

    fill(240, 255, 255);
    rect(580,220,40,80);

    fill(240, 255, 255);
    rect(580,340,40,80);

    let eyeR = pose.rightEye;
    let eyeL = pose.leftEye;
    let d = dist(640-eyeR.x, eyeR.y, 640-eyeL.x, eyeL.y);
    fill(255, 0, 0);
    ellipse(640-pose.nose.x, pose.nose.y, d);
    fill(0, 0, 255);
    ellipse(640-pose.rightWrist.x, pose.rightWrist.y, 32);
    ellipse(640-pose.leftWrist.x, pose.leftWrist.y, 32);
    
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = 640-pose.keypoints[i].position.x;
      let y = 640-pose.keypoints[i].position.y;
      fill(0,255,0);
      ellipse(x,y,16,16);
    }
    
    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(2);
      stroke(255);
      line(640-a.position.x, a.position.y,640-b.position.x,b.position.y);      
    }
  }
}