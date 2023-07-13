import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';


let container;
let camera, scene, renderer;
let controller;
let controls;
let reticle, parent,textMesh;
let hitTestSource = null;
let hitTestSourceRequested = false;

/*-----------------Loading Model-----------------------------------------*/	
const loadGLTF = (path) => {
	return new Promise((resolve, reject) => {
	  const loader = new GLTFLoader();
	  loader.load(path, (gltf) => {
		resolve(gltf);
	  });
	});
};

/*------------------------Fetching Data------------------------------------*/

let jsonMatchData, jsonPlayerStat;
var firstInningsData, secondInningsData;
let firstInningsPlayerNames, firstInningsPlayerImages, secondInningsPlayerImages, secondInningsPlayerNames, firstInningsCountry, secondInningsCountry;
// Function to fetch general data
function fetchMatchData() {
	const url = 'https://d1u2maujpzk42.cloudfront.net/icc-scores/ef884c07-5b63-4a42-ac72-3947471c43ec/player.json';
  
	return fetch(url)
	  .then(response => response.json())
	  .then(data => {
		jsonMatchData=data;
		//console.log(data);
		firstInningsData = data.first_innings_players;
        secondInningsData = data.second_innings_players;  
        // console.log(firstInningsData)
        // console.log(secondInningsData)

		firstInningsPlayerNames = data.first_innings_players.map(player => player.player_name);
      	secondInningsPlayerNames = data.second_innings_players.map(player => player.player_name);

		// console.log("First Inning Player Names:", firstInningsPlayerNames);
      	// console.log("Second Inning Player Names:", secondInningsPlayerNames);

		firstInningsPlayerImages = data.first_innings_players.map(player => player.player_image);
      	secondInningsPlayerImages = data.second_innings_players.map(player => player.player_image);
      
     	// console.log("First Inning Player Names:", firstInningsPlayerImages);
      	// console.log("Second Inning Player Names:", secondInningsPlayerImages);

		firstInningsCountry = {
			name: data.first_innings,
			flag: data.first_innings_team_logo,
			short_code: data.first_innings_shortcode
		  };
		  
		secondInningsCountry = {
			name: data.second_innings,
			flag: data.second_innings_team_logo,
			short_code: data.second_innings_shortcode
		  };

		// console.log("First innings Country & Flag:",firstInningsCountry); 
		// console.log("Second innings Country & Flag:", secondInningsCountry);
		
	  })
	  .catch(error => {
		console.error('Error fetching general data:', error);
	  });
  }
  
  // Function to fetch player-wise data
  function fetchPlayerData(playerId) {
	const url = `https://d1u2maujpzk42.cloudfront.net/icc-scores/ef884c07-5b63-4a42-ac72-3947471c43ec/${playerId}.json`;
	
	return fetch(url)
	  .then(response => response.json())
	  .then(data => {
		jsonPlayerStat=data;
		// console.log(`Player ID: ${playerId}, Player Name:${data.name}'s Data`, data);
		const balls = data.balls_details;

    	balls.forEach(ball => {
		const runs = ball.runsBat;
		const pitchMapX = ball.bowlingAnalysis.pitchMap.x;
		const pitchMapY = ball.bowlingAnalysis.pitchMap.y;
		const balllandingPosition = { x: pitchMapX, y: pitchMapY };
		const arrivalX = ball.battingAnalysis.arrival.x;
		const arrivalY = ball.battingAnalysis.arrival.y;
		const landingPosition = { x: arrivalX, y: arrivalY };

		// console.log("Runs:", runs);
		// console.log("Ball Pitch Landing Position:", balllandingPosition);
		// console.log("Ball Landing Position:", landingPosition);
		});

	  })
	  .catch(error => {
		console.error('Error fetching player data:', error);
	  });
  }
  

// Checking the functions
fetchMatchData(); // Fetch overall data
fetchPlayerData('999c8498-7b17-4a81-8ea5-9e366c535862'); // Fetch player-wise data for player with ID

/*----------------------------------Adding UI------------------------------- */

let country = firstInningsCountry;







/*-----------------Adding the Tap to Place Text-----------------------------*/

const loader = new FontLoader()
// promisify font loading
function loadFont(url) {
    return new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
    })
}

async function placeText() {
    const font = await loadFont('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json')
    let text = 'Tap to Place'
    const geometry = new TextGeometry(text, {
        font: font,
        size: 0.02,
        height: 0.002,
        curveSegments: 12,
        bevelEnabled: true,
        bevelOffset: 0,
        bevelThickness: 0.005,
        bevelSize: 0.003,
        bevelSegments: 1
    })

    const material = [
        new THREE.MeshPhongMaterial({
        	color: 0xfff2cc,
        	flatShading: true
         }), // front
        new THREE.MeshPhongMaterial({
            color: 0xffe599
        }) // side
    ]

	const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.x = 0
    pointLight.position.y = 0
    pointLight.position.z = 0
    scene.add(pointLight)
    textMesh = new THREE.Mesh(geometry, material);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    geometry.boundingBox.getCenter(textMesh.position).multiplyScalar(-1);
    textMesh.position.x = -geometry.boundingBox.max.x / 2;
	
    parent = new THREE.Object3D();
    parent.add(textMesh);
	parent.position.y = -0.19;
	parent.position.x = 0;
	parent.position.z = -0.5;
	parent.name="tapToPlace";

}

let model_rendered=false;

/*--------------------------------Adding Wagon wheel------------------------------*/

function drawWagonWheels(xVal, yVal, color) {

	var numPoints = 100;

	var start = new THREE.Vector3(0, 0, 0);

	let end = new THREE.Vector3(yVal, 0, -xVal);
  
	let points = [];
	for (let i = 0; i <= 50; i++) {
	  let p = new THREE.Vector3().lerpVectors(start, end, i / 50);
	  if (color == "0XEB6363") {
		p.y = p.y + 0.25 * Math.sin((Math.PI * i) / 50);
	  } else {
		p.y = p.y + 0.01 * Math.sin((Math.PI * i) / 50);
	  }
	  points.push(p);
	}
	let curve = new THREE.CatmullRomCurve3(points);
	// var curveQuad = new THREE.QuadraticBezierCurve3(start, middle, end);
  
	var tube = new THREE.TubeGeometry(curve, numPoints, 0.005, 100, false);
	var mesh = new THREE.Mesh(
	  tube,
	  new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
	  })
	);
  
	
	mesh.scale.set(0.3, 0.3, 0.3);
	mesh.position.set(0, 0, 0);
	mesh.castShadow = true;// shadow
	// mesh.position.set(-7, 5, -5);
	// mesh.rotation.x = Math.PI / 7;
	//mesh.name = "WagonWheels_" + name;
	mesh.material.color.setHex(color);

	const stadium = scene.getObjectByName("stadium");
	stadium.add(mesh); //tubes are made children to stadium here.
	//_runStore.push(mesh); //1,2,3,4,6 buttons, used in displaylines
	stadium.receiveShadow = true; //shadow
}



function boundingBox(model)
{
	//bounding box helper for the model
	const bbox = new THREE.Box3().setFromObject(model);

	// Calculating the dimensions
	const width = bbox.max.x - bbox.min.x;
	const height = bbox.max.y - bbox.min.y;
	const depth = bbox.max.z - bbox.min.z;

	// Printing the dimensions to the console
	console.log('Width:', width);
	console.log('Height:', height);
	console.log('Depth:', depth);
	console.log('Max X:', bbox.max.x);
	console.log('Max Y:', bbox.max.y);
	console.log('Max Z:', bbox.max.z);
	console.log('Min X:', bbox.min.x);
	console.log('Min Y:', bbox.min.y);
	console.log('Min Z:', bbox.min.z);
	// Create a bounding box helper to visualize the bounding box
	const bboxHelper = new THREE.Box3Helper(bbox, 0x0000ff); // Specify the color as the second parameter

	// Add the bounding box helper to the scene
	scene.add(bboxHelper);
	// Optionally, you can position the camera to view the entire scene
	const center = bbox.getCenter(new THREE.Vector3()); // Get the center of the bounding box
	const size = bbox.getSize(new THREE.Vector3()); // Get the size of the bounding box

	const maxDimension = Math.max(size.x, size.y, size.z); // Get the maximum dimension of the bounding box

	const fov = camera.fov * (Math.PI / 180); // Convert the camera's field of view to radians
	const cameraDistance = Math.abs(maxDimension / (2 * Math.tan(fov / 2))); // Calculate the distance based on the maximum dimension

	camera.position.copy(center); // Set the camera position to the center of the bounding box
	camera.position.z += cameraDistance; // Move the camera back by the calculated distance
	camera.lookAt(center); // Point the camera at the center of the bounding box
 
}

function getPosition(model,reticle)
{
	const modelPosition = model.position;
	console.log('model postion:', modelPosition);
	const reticlePosition = reticle.position;
	console.log('reticle postion:', reticlePosition);
}

/*---------------------------------XR Session------------------------------*/
function createButtons() {
	const session = renderer.xr.getSession();
	if (!session || !session.domOverlay) {
	  console.warn('DOM overlay is not supported in this WebXR session.');
	  return;
	}
  
	// Create buttons and add them to the DOM overlay
	const buttonContainer = document.createElement('div');
	buttonContainer.classList.add('button-container');
  
	const button1 = document.createElement('button');
	button1.textContent = 'Button 1';
	button1.addEventListener('click', () => {
	  // Handle button 1 click event
	});
	buttonContainer.appendChild(button1);
  
	const button2 = document.createElement('button');
	button2.textContent = 'Button 2';
	button2.addEventListener('click', () => {
	  // Handle button 2 click event
	});
	buttonContainer.appendChild(button2);
  
	// Append the button container to the DOM overlay
	session.domOverlay.root.appendChild(buttonContainer);
  }
  



/*---------------------------------INIT FUNCTION-------------------------------*/


function init() {

	container = document.createElement( 'div' );
				//document.getElementById("container").appendChild( container );
	document.body.appendChild( container );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
	
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(0, 10, 0);
	light.castShadow = true;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	light.shadow.bias = -0.001;
	scene.add(light);


	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.shadowMap.enabled = true; //shadow
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //shadow
	container.appendChild( renderer.domElement );

	controls=new OrbitControls(camera, renderer.domElement);
	controls.addEventListener('change',render);
	controls.minDistance = 2;
	controls.maxDistance = 10;
	controls.target.set(0,0,-0.2);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	let options = {
		requiredFeatures: ['hit-test','dom-overlay'],
	}
	//options.domOverlay = {root: document.getElementById('content-ar')};
	document.body.appendChild( ARButton.createButton( renderer, options ) );
//	document.body.appendChild( UI.createButton( renderer, options ) );



	reticle = new THREE.Mesh(
		new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
		new THREE.MeshBasicMaterial()
		);
	reticle.matrixAutoUpdate = false;
	reticle.visible = false;
	scene.add( reticle );	
		
	placeText();
	//parent.visible=false;
	// console.log(textMesh.visible);
	// console.log(parent.visible);
	const onSelect = async()=>{
		if ( reticle.visible ) {
			
			const stadium= await loadGLTF('static/Stadium_v2_1.glb');
			const model = stadium.scene;
			model.position.copy(reticle.position);
			model.position.y-=0.2;
			model.position.z-=0.5;
			model.quaternion.copy(reticle.quaternion);
			model.scale.set(0.3, 0.3, 0.3);
			var box= new THREE.Box3();
			box.setFromObject(model);
		
			model.name="stadium";
			scene.add(model);
			drawWagonWheels(0.2,0.8,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.15,0.25,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(-0.215,-0.15,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(0.25,0.3,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(-0.1,0.46,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(0.4,-0.1,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(-0.5,0.15,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(0.8,0.38,"0x8EB6F0"); // **blue(4's)
			drawWagonWheels(-0.6,-0.6,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.68,0.8,"0x9EADC3");//blue(4's)
			drawWagonWheels(-0.8,-0.18,"0x9EADC3");//blue(4's)
			drawWagonWheels(0.7,0.7,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.85,0.85,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.48,0.48,"0x9EADC3");//blue(4's)
			drawWagonWheels(0.4,-0.68,"0x9EADC3");//blue(4's)
			//boundingBox(model);
			model_rendered=true;
			createButtons();

		}


	}

    onSelect();

	controller = renderer.xr.getController( 0 );
	controller.addEventListener( 'select', onSelect );
	scene.add( controller );



	window.addEventListener( 'resize', onWindowResize );


}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	controls.update();

}

function animate() {

	renderer.setAnimationLoop( render );
	requestAnimationFrame(animate);
	controls.update();

}

function render( timestamp, frame ) {

	if ( frame ) {

		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		if ( hitTestSourceRequested === false ) {

			session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

			session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

			hitTestSource = source;

		} );

	} );


	session.addEventListener( 'end', function () {

		hitTestSourceRequested = false;
		hitTestSource = null;

	} );

	hitTestSourceRequested = true;

	}
	if ( hitTestSource ) {

		const hitTestResults = frame.getHitTestResults( hitTestSource );
	
					
		if ( hitTestResults.length ) {

			const hit = hitTestResults[ 0 ];

			reticle.visible = true;
			reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
			scene.add(parent); //Tap to place text added when model visible
			

		} else {

			reticle.visible = false;

		}
		if(model_rendered)
		{
			reticle.visible = false;
			scene.remove(parent); //Tap to place text removed when model rendered

		}


	}

    }

	renderer.render( scene, camera );

}
init();
animate();