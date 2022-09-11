"use strict";
// SET THE SCENE

// SET PATH TO DIRECTORY ROOT
var path = "";

// SCENE ESSENTIALS
var container,camera, scene, renderer, stats,chsCam;
var keyboard = new THREEx.KeyboardState();
var cameraControls, effectController;

//CAMERA
var chsOffst = new THREE.Vector3( 0, 120, -60); // CHASE ORIGIN
var drvSt = new THREE.Vector3( 0, 120, -60), drvStOffst;// DRIVER SEAT ORIGIN AND TARGET


// TIME
var clock = new THREE.Clock();
var newTime =0, oldTime =0;


// ENVIRONMENT LIGHTING VARIABLES
var cbCmr;
var sunLght, skyLght;
var skyBox = [], carEnv;

// CAR STATE
var crPos;
var maxAccTime = 20, tpSpd = 2500;
var u = 0,v =0, accCoff = 0, accTime = 0;
var carRot = 0, whlRot = 0, prevRotComp = 0, hisWhlRot = 0;
var tyrOffst = [];

// SCENE OBJECTS
var car, trrn, hs, grg, lmp;
var prevRot=0, rotTime=0;
var lmpLights = [];

// OBJECT PARTS AND MATERIALS

// CAR
var crBdy   , crRm = [], crWdnPnl   , crSt   , crWhl = [], crWndw   , crFrntLght   , crBckLght    ,crWndw   , crWndwStnd   , crBs   , crFlr   , crInsd   ,crBckLghtRflctr; 
var crBdyMtl, crRmMtl  , crWdnPnlMtl, crStMtl, crWhlMtl  , crWndwMtl, crFrntLghtMtl, crBckLghtMtl ,crWndwMtl, crWndwStndMtl, crBsMtl, crFlrMtl, crInsdMtl,crBckLghtRflctrMtl;
// TERRAIN
var trrnGrnd, currGrnd = 1, trrnRd   , trrnHsPth   , trrnGrgGrnd   , trrnDvdr   ,trrnCliffs;
var trrnGrndMtl = []      , trrnRdMtl, trrnHsPthMtl, trrnGrgGrndMtl, trrnDvdrMtl,trrnCliffsMtl;
// HOUSE
var hsWll   , hsWndw   , hsWndwPn   , hsDr   , hsRf   ;
var hsWllMtl, hsWndwMtl, hsWndwPnMtl, hsDrMtl, hsRfMtl;
// GARAGE
var grgWll   , grgDr   ;
var grgWllMtl, grgDrMtl;
// LAMP
var lmpStnd   , lmpTrns, lmpTrnsSlv,lmpLght;
var lmpStndMtl, lmpTrnsMtl         ,lmpLghtMtl;
init();
animate();

function init() 
{
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	
	
	

	// INITIALIZE CAR STATE
	crPos = new THREE.Vector3( 0, 10, -24.291 );
	
	// CAMERA
	camera = new THREE.PerspectiveCamera( 35, canvasWidth/ canvasHeight, 1, 500000 );
	camera.position.set( 100, 60, -300 );
	
	// SKYBOX
	var loader = new THREE.CubeTextureLoader()
	loader.setPath(path + 'assets/textures/');
	skyBox[0] = loader.load
	([
		'mpz.png','mnz.png','mpy.png','mny.png','mpx.png','mnx.png'
	]);
	skyBox[1] = loader.load
	([
		'npz.png','nnz.png','npy.png','nny.png','npx.png','nnx.png'
	]);
	// SCENE
	scene = new THREE.Scene();
	scene.background = skyBox[0];
	scene.fog = new THREE.Fog( 0x0, 2000, 4000 );

	// LIGHTS
	skyLght = new THREE.AmbientLight( 0xAAAABB );
	scene.add(skyLght);
	sunLght = new THREE.DirectionalLight( 0xCCCCAA  );
	sunLght.position.set( -6500, 3000, 6500 );
	sunLght.castShadow = true;
	sunLght.shadow.camera.right =  500000;
	sunLght.shadow.camera.left = -500000;
	sunLght.shadow.camera.top =  500000;
	sunLght.shadow.camera.bottom = -500000;
	sunLght.shadow.camera.near = 0.5;
	sunLght.shadow.camera.far = 20000
	sunLght.shadow.bias = 0.0001;
	sunLght.shadow.mapSize.width = 512;
	sunLght.shadow.mapSize.height = 512;
	scene.add( sunLght );

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.clearColor;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	
	// SETTING UP FPS COUNTER
	addToDOM();
	stats = new Stats();
	stats.showPanel( 1 );
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	setupGui();

	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	cameraControls.target.copy(crPos);
	
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	
	
	//CAR ENV
	cbCmr = new THREE.CubeCamera( 1, 100000, 128 );
	cbCmr.position.copy( crPos );
	scene.add( cbCmr );
	carEnv = cbCmr.renderTarget.texture;

	createMaterials();
	addLamp();
	addBuildings();
	addTerrain();
	addCar();
}

function setupGui()
{

	effectController =
	{
		fps: 16.0,
		cmr: 1,
		skyTyp: 1,
		trrnGrndTyp: 1
		
	};

	var gui = new dat.GUI();

	var element = gui.add( effectController, "fps", 1.0, 60.0 ).step(1.0);
	element.name("FPS");
	var element = gui.add( effectController, "cmr", 1.0, 3.0 ).step(1.0);
	element.name("Camera");
	var element = gui.add( effectController, "skyTyp", 0.0, 1.0 ).step(1.0);
	element.name("Day/Night");
	var element = gui.add( effectController, "trrnGrndTyp", 1.0, 2.0 ).step(1.0);
	element.name("Terrain");
	
}

function addToDOM()
{
	container = document.getElementById('container');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeobject(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}

function createMaterials()
{
	var i;
	// CAR
	
	// BODY

	crBdyMtl = new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.3, envMap: skyBox } );
	
	// RIMS
	crRmMtl = new THREE.MeshStandardMaterial({color: 0xDDDDDD, roughness: 0.6, metalness: 1});
	
	// WOODEN PANEL
	var woodPnl = new THREE.TextureLoader().load('assets/textures/wd.jpg');
	woodPnl.wrapS = THREE.RepeatWrapping;
	woodPnl.wrapT = THREE.RepeatWrapping;
	woodPnl.repeat.set(1,3);
	crWdnPnlMtl = new THREE.MeshStandardMaterial({map: woodPnl, roughness: 0.1, metalness: 0.4});
	
	// HEAD LIGHTS
	crFrntLghtMtl = new THREE.MeshLambertMaterial({emissive: 0xdedede});
	
	// TAIL LIGHTS
	crBckLghtMtl = new THREE.MeshStandardMaterial({color: 0x111133, metalness: 0.4, roughness:0.35, transparent: true, opacity:0.6});
	
	// TAIL LIGHT REFLECTORS
	var crBckLghtRflctrMtl = new THREE.MeshStandardMaterial({color: 0x222222, metalness:0.8, roughness:0.4});
	crBckLghtRflctrMtl.side = THREE.BackSide;
	
	// SEATS
	var stLthr = new THREE.TextureLoader().load( 'assets/textures/Leather_S.jpg') ;
	stLthr.wrapS = THREE.RepeatWrapping;
	stLthr.wrapT = THREE.RepeatWrapping;
	stLthr.repeat.set(15,15*2048/2820);
	var stLthrN = new THREE.TextureLoader().load( 'assets/textures/Leather_N.jpg') ;
	stLthrN.wrapS = THREE.RepeatWrapping;
	stLthrN.wrapT = THREE.RepeatWrapping;
	stLthrN.repeat.set(15,15*2048/2820);
	crStMtl = new THREE.MeshStandardMaterial({map: stLthr, normalMap: stLthrN ,roughness: 0.4, metalness: 0.1});
	crStMtl.side = THREE.BackSide;
	
	// WHEELS
	var tyre = new THREE.TextureLoader().load( 'assets/texture/tyre.jpg');
	tyre.wrapS = THREE.RepeatWrapping;
	tyre.wrapT = THREE.RepeatWrapping;
	tyre.repeat.set(1,1);
	crWhlMtl = new THREE.MeshStandardMaterial({map: tyre, roughness: 0.05, metalness: 0});
	
	// WINDOW
	crWndwMtl = new THREE.MeshPhongMaterial({color: 0x555555, transparent: true, opacity: 0.3});

	// WINDOW STAND
	crWndwStndMtl = new THREE.MeshStandardMaterial({color: 0x000000, roughness: 0.9, metalness: 0});
	
	// BASE
	crBsMtl = new THREE.MeshStandardMaterial({color: 0x000000, roughness: 0.9, metalness: 0});
	
	// FLOOR
	var crflrmt = new THREE.TextureLoader().load( 'assets/textures/carp.jpg' );
	crflrmt.wrapS = THREE.RepeatWrapping;
	crflrmt.wrapT = THREE.RepeatWrapping;
	crflrmt.repeat.set(5,5*1300/880);
	crFlrMtl = new THREE.MeshStandardMaterial({map: crflrmt, roughness: 0.8, metalness: 0});
	
	// INSIDE
	var insLthr = new THREE.TextureLoader().load( 'assets/textures/RghLthr_albedo.jpg') ;
	insLthr.wrapS = THREE.RepeatWrapping;
	insLthr.wrapT = THREE.RepeatWrapping;
	insLthr.repeat.set(6,6);
	var insLthrN = new THREE.TextureLoader().load( 'assets/textures/RghLthr_normal.jpg') ;
	insLthrN.wrapS = THREE.RepeatWrapping;
	insLthrN.wrapT = THREE.RepeatWrapping;
	insLthrN.repeat.set(6,6);
	var insLthrA = new THREE.TextureLoader().load( 'assets/textures/RghLthr_ao.jpg') ;
	insLthrA.wrapS = THREE.RepeatWrapping;
	insLthrA.wrapT = THREE.RepeatWrapping;
	insLthrA.repeat.set(6,6);
	var insLthrR = new THREE.TextureLoader().load( 'assets/textures/RghLeather_roughness.jpg') ;
	insLthrR.wrapS = THREE.RepeatWrapping;
	insLthrR.wrapT = THREE.RepeatWrapping;
	insLthrR.repeat.set(6,6);
	var insLthrH = new THREE.TextureLoader().load( 'assets/textures/RghLeather_height.jpg') ;
	insLthrH.wrapS = THREE.RepeatWrapping;
	insLthrH.wrapT = THREE.RepeatWrapping;
	insLthrH.repeat.set(6,6);
	crInsdMtl = new THREE.MeshStandardMaterial({map:insLthr, normalMap:insLthrN, roughnessMap: insLthrR, displacementMap: insLthrH, aoMap:insLthrA});
	
	
	//TERRAIN
	
	
	// GROUND
	var grass = [], grassH = [], grassN = [], grassS = [];

	grass[0] = new THREE.TextureLoader().load('assets/textures/grass.png');
	grass[0].wrapS = THREE.RepeatWrapping;
	grass[0].wrapT = THREE.RepeatWrapping;
	grass[0].repeat.set( 32, 32 );
	grassN[0] = new THREE.TextureLoader().load('assets/textures/grassN.png');
	grassN[0].wrapS = THREE.RepeatWrapping;
	grassN[0].wrapT = THREE.RepeatWrapping;
	grassN[0].repeat.set( 32, 32 );
	grass[1] = new THREE.TextureLoader().load('assets/textures/grass2.png');
	grass[1].wrapS = THREE.RepeatWrapping;
	grass[1].wrapT = THREE.RepeatWrapping;
	grass[1].repeat.set( 32, 32 );
	grassN[1] = new THREE.TextureLoader().load('assets/textures/grass2N.png');
	grassN[1].wrapS = THREE.RepeatWrapping;
	grassN[1].wrapT = THREE.RepeatWrapping;
	grassN[1].repeat.set( 32, 32 );
	for( i=0 ; i<2 ; i++ )
		trrnGrndMtl[i] = new THREE.MeshPhongMaterial({ map: grass[i], normalMap: grassN[i]});
	// ROAD

	var roadTexture = new THREE.TextureLoader().load( 'assets/textures/aspha-alb.jpg') ;
	roadTexture.wrapS = THREE.RepeatWrapping; 
	roadTexture.wrapT = THREE.RepeatWrapping;
	roadTexture.repeat.set( 60, 60 );

	var roadNorm = new THREE.TextureLoader().load( 'assets/textures/aspha-nrm.jpg') ;
	roadNorm.wrapS = THREE.RepeatWrapping; 
	roadNorm.wrapT = THREE.RepeatWrapping;
	roadNorm.repeat.set( 60, 60 );
	
	var roadRgh = new THREE.TextureLoader().load( 'assets/textures/aspha-rgh.jpg') ;
	roadRgh.wrapS = THREE.RepeatWrapping; 
	roadRgh.wrapT = THREE.RepeatWrapping;
	roadRgh.repeat.set( 60, 60 );

	var roadHght = new THREE.TextureLoader().load( 'assets/textures/aspha-hght.jpg') ;
	roadHght.wrapS = THREE.RepeatWrapping; 
	roadHght.wrapT = THREE.RepeatWrapping;
	roadHght.repeat.set( 60, 60 );
	
	trrnRdMtl = new THREE.MeshStandardMaterial({map:roadTexture, normalMap:roadNorm, roughnessMap:roadRgh, displacementMap: roadHght});
	
	// HOUSE PATH
	trrnHsPthMtl = new THREE.MeshStandardMaterial({color: 0xDDDDAA, roughness: 0.9, metalness: 0})
	
	// GARAGE GROUND
	var concgrnd = new THREE.TextureLoader().load('assets/textures/ConcFlr.jpg');
	concgrnd.wrapS = THREE.RepeatWrapping;
	concgrnd.wrapT = THREE.RepeatWrapping;
	concgrnd.repeat.set( 7 , 7 );
	trrnGrgGrndMtl = new THREE.MeshPhongMaterial({map: concgrnd});
	
	// DIVIDER
	trrnDvdrMtl = new THREE.MeshStandardMaterial({color: 0xFFDDFF, roughness: 0.5, metalness: 0})
	
	// CLIFFS
	var clff = new THREE.TextureLoader().load('assets/textures/CliffRock.jpg');
	clff.wrapS = THREE.RepeatWrapping;
	clff.wrapT = THREE.RepeatWrapping;
	clff.repeat.set(5,5);
	var clffN = new THREE.TextureLoader().load('assets/textures/CliffRock_N.jpg');
	clffN.wrapS = THREE.RepeatWrapping;
	clffN.wrapT = THREE.RepeatWrapping;
	clffN.repeat.set(5,5);
	trrnCliffsMtl = new THREE.MeshStandardMaterial({map: clff, normalMap: clffN });
	
	// HOUSE
	
	// ROOF
	hsRfMtl = new THREE.MeshStandardMaterial({color: 0x663311, roughness: 0.3, metalness: 0})
	
	// DOOR
	var wdoor = new THREE.TextureLoader().load('assets/textures/Wood.jpg');
	wdoor.wrapS = THREE.RepeatWrapping;
	wdoor.wrapT = THREE.RepeatWrapping;
	wdoor.repeat.set(3,3);
	hsDrMtl = new THREE.MeshStandardMaterial({ map: wdoor, roughness: 0.3, metalness: 0});
	
	// WINDOW
	hsWndwMtl = new THREE.MeshStandardMaterial({map: wdoor, roughness: 0.1, metalness: 0})
	
	// WINDOW PANE
	hsWndwPnMtl = new THREE.MeshStandardMaterial({metalness:0.5, roughness:0.9});
	
	// WALLS
	var hsWall = new THREE.TextureLoader().load('assets/textures/wll-alb.jpg');
	hsWall.wrapS = THREE.RepeatWrapping;
	hsWall.wrapT = THREE.RepeatWrapping;
	hsWall.repeat.set(0.4,0.4);
	var hsWallN = new THREE.TextureLoader().load('assets/textures/wll-nrm.jpg');
	hsWallN.wrapS = THREE.RepeatWrapping;
	hsWallN.wrapT = THREE.RepeatWrapping;
	hsWallN.repeat.set(0.4,0.4);
	var hsWallD = new THREE.TextureLoader().load('assets/textures/wll-hght.jpg');
	hsWallD.wrapS = THREE.RepeatWrapping;
	hsWallD.wrapT = THREE.RepeatWrapping;
	hsWallD.repeat.set(0.4,0.4);
	var hsWallR = new THREE.TextureLoader().load('assets/textures/wll-rgh.jpg');
	hsWallR.wrapS = THREE.RepeatWrapping;
	hsWallR.wrapT = THREE.RepeatWrapping;
	hsWallR.repeat.set(0.4,0.4);
	hsWllMtl = new THREE.MeshStandardMaterial({map: hsWall, normalMap: hsWallN, aoMap: hsWallA, roughnessMap: hsWallR});
	
	
	// GARAGE
	
	// DOOR
	grgDrMtl = new THREE.MeshStandardMaterial({color: 0xDDDDDD, roughness: 0.6, metalness: 1});
	
	// WALLS
	var grgWall = new THREE.TextureLoader().load('assets/textures/concrete-wallRGB.jpg');
	grgWall.wrapS = THREE.RepeatWrapping;
	grgWall.wrapT = THREE.RepeatWrapping;
	grgWall.repeat.set(5,5);
	var grgWallN = new THREE.TextureLoader().load('assets/textures/concrete-wallN.jpg');
	grgWallN.wrapS = THREE.RepeatWrapping;
	grgWallN.wrapT = THREE.RepeatWrapping;
	grgWallN.repeat.set(5,5);
	grgWllMtl = new THREE.MeshStandardMaterial({map:grgWall, normalMap:grgWallN, roughness: 0.8, metalness: 0});
	
	
	// LAMP
	
	// STAND
	lmpStndMtl = new THREE.MeshStandardMaterial({color: 0x441100, roughness: 0.1, metalness: 0});
	
	// TRANSPARENT
	lmpTrnsMtl = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.2, metalness: 0.2, transparent: true,opacity : 0.2});
	
	// LIGHT
	
	lmpLghtMtl = new THREE.MeshStandardMaterial({emissive: 0xFFFFDD, roughness:0.3})
	
}

function addCar()
{
	var i,loader = new THREE.JSONLoader();
	
	// CAR
	car = new THREE.Group();
	
	// BODY
	loader.load( 'assets/models/JS/crBdy.js', function ( geometry ) 
	{
        crBdy = new THREE.Mesh( geometry, crBdyMtl );
		car.add( crBdy );
	});
	
	tyrOffst[0] = new THREE.Vector3(35.0,-9.572,29.027);
	tyrOffst[1] = new THREE.Vector3(-35.0,-9.572,29.027);
	tyrOffst[2] = new THREE.Vector3(35.0,-9.572,-29.148);
	tyrOffst[3] = new THREE.Vector3(-35.0,-9.572,-29.148);
	
 
	loader.load( 'assets/models/JS/crWhl.js', function ( geometry ) 
	{
		
		crWhl[0] = new THREE.Mesh( geometry, crWhlMtl );
		crWhl[0].position.copy(tyrOffst[0]);
		car.add( crWhl[0] );
	});
	loader.load( 'assets/models/JS/crWhl.js', function ( geometry ) 
	{
		
		crWhl[1] = new THREE.Mesh( geometry, crWhlMtl );
		crWhl[1].position.copy(tyrOffst[1]);
		car.add( crWhl[1] );
	});
	loader.load( 'assets/models/JS/crWhl.js', function ( geometry ) 
	{
		
		crWhl[2] = new THREE.Mesh( geometry, crWhlMtl );
		crWhl[2].position.copy(tyrOffst[2]);
		car.add( crWhl[2] );
	});
	loader.load( 'assets/models/JS/crWhl.js', function ( geometry ) 
	{
		
		crWhl[3] = new THREE.Mesh( geometry, crWhlMtl );
		crWhl[3].position.copy(tyrOffst[3]);
		car.add( crWhl[3] );
	});

	// LEFT RIMS
	loader.load( 'assets/models/JS/crRmL.js', function ( geometry ) 
	{			
        crRm[0] = new THREE.Mesh( geometry, crRmMtl );
		crRm[0].position.copy(tyrOffst[0]);
		car.add( crRm[0] );
	});
	loader.load( 'assets/models/JS/crRmL.js', function ( geometry ) 
	{		
		crRm[2] = new THREE.Mesh( geometry, crRmMtl );
		crRm[2].position.copy(tyrOffst[1]);
		car.add( crRm[2] );
	});
	
	// RIGHT RIMS
	loader.load( 'assets/models/JS/crRmR.js', function ( geometry ) 
	{		
        crRm[1] = new THREE.Mesh( geometry, crRmMtl );
		crRm[1].position.copy(tyrOffst[2]);
		car.add( crRm[1] );
	});
	loader.load( 'assets/models/JS/crRmR.js', function ( geometry ) 
	{	
		crRm[3] = new THREE.Mesh( geometry, crRmMtl );
		crRm[3].position.copy(tyrOffst[3]);
		car.add( crRm[3] );
	});
	
	// SEATS
	loader.load( 'assets/models/JS/crSt.js', function ( geometry ) 
	{
        crSt = new THREE.Mesh( geometry, crStMtl );
		car.add( crSt );
	});
	
	// HEAD LIGHTS
	loader.load( 'assets/models/JS/crFrntLght.js', function ( geometry ) 
	{
        crFrntLght = new THREE.Mesh( geometry, crFrntLghtMtl );  
		car.add( crFrntLght );
	});
	
	// TAIL LIGHTS
	loader.load( 'assets/models/JS/crBckLght.js', function ( geometry ) 
	{
        crBckLght = new THREE.Mesh( geometry, crBckLghtMtl );  
		car.add( crBckLght );
	});
	
	loader.load( 'assets/models/JS/crBckLghtRflctr.js', function ( geometry ) 
	{
        crBckLghtRflctr = new THREE.Mesh( geometry, crBckLghtRflctrMtl );  
		car.add( crBckLghtRflctr );
	});
	
	// BASE
	loader.load( 'assets/models/JS/crBs.js', function ( geometry ) 
	{
        crBs = new THREE.Mesh( geometry, crBsMtl );  
		car.add( crBs );
	});
	
	// WOODEN PANEL
	loader.load( 'assets/models/JS/crWdnPnl.js', function ( geometry ) 
	{
        crWdnPnl = new THREE.Mesh( geometry, crWdnPnlMtl );
		car.add( crWdnPnl );
	});
	
	// WINDOW
	loader.load( 'assets/models/JS/crWndw.js', function ( geometry ) 
	{
        crWndw = new THREE.Mesh( geometry, crWndwMtl );       
		car.add( crWndw );
	});
	
	// WINDOW STAND
	loader.load( 'assets/models/JS/crWndwStnd.js', function ( geometry ) 
	{
        crWndwStnd = new THREE.Mesh( geometry, crWndwStndMtl );
		car.add( crWndwStnd );
	});
	
	// INSIDE
	loader.load( 'assets/models/JS/crInsd.js', function ( geometry ) 
	{
        crInsd = new THREE.Mesh( geometry, crInsdMtl );
		car.add( crInsd );
	});
	
	// FLOOR
	loader.load( 'assets/models/JS/crFlr.js', function ( geometry ) 
	{
        crFlr = new THREE.Mesh( geometry, crFlrMtl );
		car.add( crFlr );
	});
	
	car.position.copy( crPos );
	car.traverse
	( 
		function(object) 
		{
			if (object instanceof THREE.Mesh) 
			{
				object.castShadow = true;
				object.receiveShadow = true;
			}
		}
	);
	scene.add( car );
}
function addLamp()
{
	var loader = new THREE.JSONLoader();
	
	// LAMP
	lmp = new THREE.Group();
	
	// STAND
	loader.load( 'assets/models/JS/lmpStnd.js', function ( geometry ) 
	{
        lmpStnd = new THREE.Mesh( geometry, lmpStndMtl );
		lmp.add( lmpStnd );
	});
	
	// TRANSPARENT
	/*loader.load( 'assets/models/JS/lmpTrns.js', function ( geometry ) 
	{
        lmpTrns = new THREE.Mesh( geometry, lmpTrnsMtl );
		lmp.add( lmpTrns );
	});*/
	loader.load( 'assets/models/JS/lmpTrnsSlv2.js', function ( geometry ) 
	{
		var lmpTrnsSlv = [],lmpPos = [],i,j;
		lmpPos[0] = new THREE.Vector3(841.524,105,399.738);
		lmpPos[1] = new THREE.Vector3(185.805,105,399.738);
		lmpPos[2] = new THREE.Vector3(-469.913,105,399.738);
		lmpPos[3] = new THREE.Vector3(-1125.631,105,399.738);
			for( i=0 ; i<4 ; i++ )
			{
				
				for(j=0;j<4;j++)
					lmpTrnsSlv[i*4+j] = new THREE.Mesh( geometry, lmpTrnsMtl );
				
				lmpTrnsSlv[i*4].position.set(lmpPos[i].x + 17.353,lmpPos[i].y,lmpPos[i].z + 17.302 );
				lmpTrnsSlv[i*4+1].position.set(lmpPos[i].x + 17.353,lmpPos[i].y,lmpPos[i].z - 17.302 );
				lmpTrnsSlv[i*4+2].position.set(lmpPos[i].x - 17.353,lmpPos[i].y,lmpPos[i].z + 17.302 );
				lmpTrnsSlv[i*4+3].position.set(lmpPos[i].x - 17.353,lmpPos[i].y,lmpPos[i].z - 17.302 );

				for( j=0 ; j<4 ; j++ )
					lmp.add(lmpTrnsSlv[i*4+j]);
			}

	});


    loader.load( 'assets/models/JS/lmpLght.js', function ( geometry ) 
	{
			var lmpPos = [],i,j, bulbs = [];
			lmpPos[0] = new THREE.Vector3(841.524,107,399.738);
			lmpPos[1] = new THREE.Vector3(185.805,107,399.738);
			lmpPos[2] = new THREE.Vector3(-469.913,107,399.738);
			lmpPos[3] = new THREE.Vector3(-1125.631,107,399.738);
			for( i=0 ; i<4 ; i++ )
			{
				
				for(j=0;j<4;j++)
					bulbs[i*4+j] = new THREE.Mesh( geometry, lmpLghtMtl );
				
				bulbs[i*4].position.set(lmpPos[i].x + 17.353,lmpPos[i].y,lmpPos[i].z + 17.302);
				bulbs[i*4+1].position.set(lmpPos[i].x + 17.353,lmpPos[i].y,lmpPos[i].z - 17.302);
				bulbs[i*4+2].position.set(lmpPos[i].x - 17.353,lmpPos[i].y,lmpPos[i].z + 17.302);
				bulbs[i*4+3].position.set(lmpPos[i].x - 17.353,lmpPos[i].y,lmpPos[i].z - 17.302);
				
				bulbs[i*4].position.set(lmpPos[i].x + 17.353,lmpPos[i].y,lmpPos[i].z + 17.302);
				bulbs[i*4+1].position.set(lmpPos[i].x + 17.353,lmpPos[i].y,lmpPos[i].z - 17.302);
				bulbs[i*4+2].position.set(lmpPos[i].x - 17.353,lmpPos[i].y,lmpPos[i].z + 17.302);
				bulbs[i*4+3].position.set(lmpPos[i].x - 17.353,lmpPos[i].y,lmpPos[i].z - 17.302);
				for( j=0 ; j<4 ; j++ )
				{
					lmp.add(bulbs[i*4+j]);
					
					lmpLights[i*4+j] = new THREE.SpotLight(0xFFFFDD);
					lmpLights[i*4+j].penumbra = 0.5;
					lmpLights[i*4+j].castShadow = true;
					lmpLights[i*4+j].shadow.mapSize.width = 1024;
					lmpLights[i*4+j].shadow.mapSize.height = 1024;
					lmpLights[i*4+j].shadow.camera.near = 500;
					lmpLights[i*4+j].shadow.camera.far = 4000;
					lmpLights[i*4+j].shadow.camera.fov = 30;
					scene.add( lmpLights[i*4+j].target );
					lmpLights[16+i*4+j] = new THREE.PointLight(0xFFFFDD);
					lmpLights[16+i*4+j].penumbra = 0.5;
					lmpLights[16+i*4+j].castShadow = true;
					lmpLights[16+i*4+j].shadow.mapSize.width = 1024;
					lmpLights[16+i*4+j].shadow.mapSize.height = 1024;
					lmpLights[16+i*4+j].shadow.camera.near = 500;
					lmpLights[16+i*4+j].shadow.camera.far = 4000;
					lmpLights[16+i*4+j].shadow.camera.fov = 30;
				}

				lmpLights[i*4].position.set(lmpPos[i].x+17.353,lmpPos[i].y+1,lmpPos[i].z+17.302);
				lmpLights[i*4+1].position.set(lmpPos[i].x+17.353,lmpPos[i].y+1,lmpPos[i].z-17.302);
				lmpLights[i*4+2].position.set(lmpPos[i].x-17.353,lmpPos[i].y+1,lmpPos[i].z+17.302);
				lmpLights[i*4+3].position.set(lmpPos[i].x-17.353,lmpPos[i].y+1,lmpPos[i].z-17.302);
				lmpLights[16+i*4].position.set(lmpPos[i].x+17.353,lmpPos[i].y-4,lmpPos[i].z+17.302);
				lmpLights[16+i*4+1].position.set(lmpPos[i].x+17.353,lmpPos[i].y-4,lmpPos[i].z-17.302);
				lmpLights[16+i*4+2].position.set(lmpPos[i].x-17.353,lmpPos[i].y-4,lmpPos[i].z+17.302);
				lmpLights[16+i*4+3].position.set(lmpPos[i].x-17.353,lmpPos[i].y-4,lmpPos[i].z-17.302);
				
				lmpLights[i*4].target.position.set(lmpPos[i].x+17.353,0,lmpPos[i].z+17.302);
				lmpLights[i*4+1].target.position.set(lmpPos[i].x+17.353,0,lmpPos[i].z-17.302);
				lmpLights[i*4+2].target.position.set(lmpPos[i].x-17.353,0,lmpPos[i].z+17.302);
				lmpLights[i*4+3].target.position.set(lmpPos[i].x-17.353,0,lmpPos[i].z-17.302);
				
				for( j=0 ; j<4 ; j++ )
				{
					lmp.add(lmpLights[i*4+j]);
				}
			}
		});
	lmp.traverse
	( 
		function(object) 
		{
			if (object instanceof THREE.Mesh) 
			{
				object.castShadow = true;
				object.receiveShadow = true;
			}
		}
	);
		
	scene.add( lmp );
}

function addTerrain()
{
	var loader = new THREE.JSONLoader();
	
	// TERRAIN
	trrn = new THREE.Group();
	
	// GROUND
	loader.load( 'assets/models/JS/trrnGrnd.js', function ( geometry ) 
	{
        trrnGrnd = new THREE.Mesh( geometry, trrnGrndMtl[0] );
		trrn.add( trrnGrnd );
	});
	
	// ROAD
	loader.load( 'assets/models/JS/trrnRd2.js', function ( geometry ) 
	{
        trrnRd = new THREE.Mesh( geometry, trrnRdMtl );
		trrn.add( trrnRd );
	});
	
	// HOUSE PATH
	loader.load( 'assets/models/JS/trrnHsPth.js', function ( geometry ) 
	{
        trrnHsPth = new THREE.Mesh( geometry, trrnHsPthMtl );
		trrn.add( trrnHsPth );
	});
	
	// GARAGE GROUND
	loader.load( 'assets/models/JS/trrnGrgGrnd.js', function ( geometry ) 
	{
        trrnGrgGrnd = new THREE.Mesh( geometry, trrnGrgGrndMtl );
		trrn.add( trrnGrgGrnd );
	});
	
	//DIVIDER
	loader.load( 'assets/models/JS/trrnDvdr.js', function ( geometry ) 
	{
        trrnDvdr = new THREE.Mesh( geometry, trrnDvdrMtl );
		trrn.add( trrnDvdr );
	});
	
	//CLIFFS
	loader.load( 'assets/models/JS/trrnCliffs.js', function ( geometry ) 
	{
        trrnDvdr = new THREE.Mesh( geometry, trrnCliffsMtl );
		trrn.add( trrnDvdr );
	});
	
	trrn.traverse
	( 
		function(object) 
		{
			if (object instanceof THREE.Mesh) 
			{
				object.receiveShadow = true;
			}
		}
	);
	scene.add( trrn );
}

function addBuildings()
{
	var loader = new THREE.JSONLoader();
	
	//HOUSE
	hs = new THREE.Group();
	
	//Roof
	loader.load( 'assets/models/JS/hsRf.js', function ( geometry ) 
	{
        hsRf = new THREE.Mesh( geometry, hsRfMtl );
		hsRf.position.x = -238.105;
		hsRf.position.y = 143.682;
		hsRf.position.z = -205.213;
		hs.add( hsRf );
	});
	
	//Door
	loader.load( 'assets/models/JS/hsDr.js', function ( geometry ) 
	{
        hsDr = new THREE.Mesh( geometry, hsDrMtl );
		hs.add( hsDr );
	});
	
	//Window
	loader.load( 'assets/models/JS/hsWndw.js', function ( geometry ) 
	{
        hsWndw = new THREE.Mesh( geometry, hsWndwMtl );
		hsWndw.position.x = -311.316;
		hsWndw.position.y = 55.556;
		hsWndw.position.z = -75.046;
		hs.add( hsWndw );
	});
	
	// WINDOW PANE
	loader.load( 'assets/models/JS/hsWndwPn.js', function ( geometry ) 
	{
        hsWndwPn = new THREE.Mesh( geometry, hsWndwPnMtl );
		hsWndwPn.position.x = -311.316;
		hsWndwPn.position.y = 55.556;
		hsWndwPn.position.z = -75.308;
		hs.add( hsWndwPn );
	});
	
	// WALL
	loader.load( 'assets/models/JS/hsWll.js', function ( geometry ) 
	{
        hsWll = new THREE.Mesh( geometry, hsWllMtl[0] );
		hs.add( hsWll );
	});
	hs.traverse
	(
		function(object)
		{
			if (object instanceof THREE.Mesh) 
			{
				object.castShadow = true;
				object.receiveShadow = true;
			}
		}
	);
	scene.add( hs );
	
	// GARAGE
	grg = new THREE.Object3D();

	// DOOR
	loader.load( 'assets/models/JS/grgDr.js', function ( geometry ) 
	{
        grgDr = new THREE.Mesh( geometry, grgDrMtl );
		grg.add( grgDr );
	});
	
	// WALL
	loader.load( 'assets/models/JS/grgWll.js', function ( geometry ) 
	{
        grgWll = new THREE.Mesh( geometry, grgWllMtl );
		grg.add( grgWll );
	});
	grg.traverse
	( 
		function(object) 
		{
		if (object instanceof THREE.Mesh)
		{
			object.castShadow = true;
			object.receiveShadow = true;
		}
	});
	scene.add( grg );
	
}

function animate() 
{
	requestAnimationFrame(animate);
	render();
	update();
	
}

function render() 
{
	
	var delta = clock.getDelta();
	cameraControls.update(delta);
	newTime += delta;

	// fudge factor: 0.95 correlates closer to true frame rate numbers;
	// basically, there's some friction as far as timing goes, and this adjusts for it.
	var frameTime = 0.95/effectController.fps;
	if ( effectController.fps > 59.9 )
	{
		// At 60 FPS, simply go as fast as possible;
		// Not doing so can force a frame time that is less than 60 FPS.
		frameTime = 0;
	}
	if ( newTime > oldTime + frameTime )
	{
		if(currWll!=effectController.hsWllTyp)
		{
			hsWll.material = hsWllMtl[effectController.hsWllTyp-1];
			currWll = effectController.hsWllTyp;
		}
		if(currGrnd!=effectController.trrnGrndTyp)
		{
			trrnGrnd.material = trrnGrndMtl[effectController.trrnGrndTyp-1];
			currGrnd = effectController.trrnGrndTyp;
		}
		if(currSky!=effectController.skyTyp)
		{
			if(effectController.skyTyp)
			{
				scene.background = skyBox[1];
				for( i=0 ; i<16 ; i++ )
					lmpLights[i].visible = true;
			}
			else
			{
				scene.background = skyBox[0];
				for( i=0 ; i<16 ; i++ )
					lmpLights[i].visible = false;
			}
		}
		cbCmr.position.copy(car.position);
		car.visible = false;
		cbCmr.update(renderer,scene);
		crBdyMtl.envMap = cbCmr.renderTarget.texture;
		renderer.setRenderTarget( null );
		renderer.clear();
		car.visible = true;
		oldTime = newTime;
		stats.update();
		if(effectController.cmr == 1)
		{
			camera.lookAt( car.position );
		}
		if(effectController.cmr == 2)
		{
			var relCamOff = new THREE.Vector3(0, 50, -200);
			chsOffst = relCamOff.applyMatrix4( car.matrixWorld );
			camera.position.copy(chsOffst);
			camera.lookAt( car.position );
		}
		if(effectController.cmr == 3)
		{
			var relCamOff = new THREE.Vector3(10, 8, -6);
			drvSt = relCamOff.applyMatrix4( car.matrixWorld );
			camera.position.copy(drvSt);
			var relCamOff = new THREE.Vector3(10, 10, 100);
			drvStOffst = relCamOff.applyMatrix4( car.matrixWorld );
			camera.lookAt( drvStOffst );
		}
		
		renderer.render( scene, camera );

	}
}

function update()
{

	//UM - Unaccelerated Motion, AM - Accelerated Motion 
	
	//U new = V old
	u = v;
	
	var accFlag = 0;//Assume UM
	
	// Get Small Time Interval, Unaccelerated Distance, and Unaccelerated Rotation
	var dt = clock.getDelta();
	var ds = u * dt;
	carRot = Math.PI * 2 * dt;
	var dv;
	/*
	//Compensate for previous wheel rotations
	crWhlFL.rotateOnAxis( new THREE.Vector3(0,1,0), -whlRot );
	crWhlFR.rotateOnAxis( new THREE.Vector3(0,1,0), -whlRot );
	*/
	
	// Calculate time passed assuming AM
	if(accTime>0)
		accTime = accTime + dt;
	if(accTime > maxAccTime)
	{
		maxAccTime = 20;
	}
	
	// Calculate Acceleration Coefficient
	var normAccTime = accTime / maxAccTime ;
	normAccTime = normAccTime + 0.161;
	var accCoff =   ( Math.pow( normAccTime , 2 ) / 2.3126 ) * 
					( Math.sin( normAccTime / 0.5005) ) * 2.271;
	var dv = tpSpd*accCoff;//Change in velocity as function of time accelerated and top speed
	v = Math.min(tpSpd, u+dv);//Speed saturate at Top Speed

	ds = dt*(v+u)/2;// vv - uu = 2 as 
	if ( keyboard.pressed("W") )// Forward Accelerate
	{
		accFlag = 1;//AM Confirmed
		
		car.translateZ( ds );
		if( keyboard.pressed("A") )// Accelerated Turn Left
		{
			whlRot = tyreRot(-1);
			//crWhlFL.rotateOnAxis( new THREE.Vector3(0,1,0), whlRot );
			//crWhlFR.rotateOnAxis( new THREE.Vector3(0,1,0), whlRot );
			car.rotateOnAxis( new THREE.Vector3(0,1,0), carRot - accCoff*1 );
			v = Math.max(v-50,0);
			//hisWhlRot = 1;
		}
		if( keyboard.pressed("D") )// Accelerated Turn Right
		{
			whlRot = tyreRot(-1);
			//crWhlFL.rotateOnAxis( new THREE.Vector3(0,1,0), whlRot );
			//crWhlFR.rotateOnAxis( new THREE.Vector3(0,1,0), whlRot );
			car.rotateOnAxis( new THREE.Vector3(0,1,0), -carRot + accCoff*1 );
			v = Math.max(v-50,0);
			//hisWhlRot = 1;
		}
		if(
	}
	else
	{
		if(accTime =0 )
			accCoff =0;
		accTime=0;
		v = Math.max(0,v-100*(1-accCoff));
		ds = v*dt;
		car.translateZ( ds );
	}
	
}
function tyreRot( var rotType )
{
	if( rotType == 0)
	{
		return 0;
	}
	else if(rotType == 1)
	{
		return 0;
	}
	else
	{
		return 0;
	}
}