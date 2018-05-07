var GI = function(scene , renderer){
	
	var SIZE = 32;
	var SIZE2 = SIZE * SIZE;
	var camera = new THREE.PerspectiveCamera( 120, 1, 0.001, 10000 );

	var renderer = renderer;


	var rt = new THREE.WebGLRenderTarget( SIZE, SIZE, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		stencilBuffer: false,
		depthBuffer: true
	} );

	var meshs = [];

	var bounces = 0;
	var meshIndex = 0 ;
	var currentVertex = 0;

	var clone = new THREE.Scene();

	var i;
	var l = scene.children.length;

	function getMaterial(mat){
		var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors});
		if(mat.map) material.map = mat.map;
		if(mat.color) material.color = mat.color;
		return material;
	}
	for(i = 0; i < l; i++){
		var object = scene.children[ i ];
		if(object.isMesh){
			// var geometry = object.geometry.clone();
			// var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
			// if(object.material.map) material.map = object.material.map;

			// var newObject = new THREE.Mesh(geometry, material);
			object.material = getMaterial(object.material);
			object.material.vertexColors = THREE.VertexColors;
			// object.material.needsUpdate = true;
			meshs.push(object);
		}else if(object.isLight){
			if(object.isPointLight){
				var pointSphere = new THREE.SphereBufferGeometry( 0.02, 32, 32 );
				var pointLightMaterial = new THREE.MeshBasicMaterial({color : object.color.clone().multiplyScalar(object.intensity)});
				var newObject = new THREE.Mesh(pointSphere, pointLightMaterial);
				newObject.position.copy(object.position);
				scene.add(newObject);
			}else if(object.isDirectionalLight){
				console.log('directional light is not supported');
			}

			object.visible = false;
		}
	}


	var clone = scene.clone();
	clone.autoUpdate = false;

	console.log(clone);

	var normalMatrix = new THREE.Matrix3();

	var position = new THREE.Vector3();
	var normal = new THREE.Vector3();

	var bounces = 0;
	var currentVertex = 0;

	var color = new Float32Array( 3 );
	var buffer = new Uint8Array( SIZE2 * 4 );

	function compute(){
		if ( bounces === 3 ) {
			console.log('end');
			// end = Date.now();
			// console.log( (end - begin ) / 1000 );
			return;
		}

		var object = meshs[ meshIndex ];
		var geometry = object.geometry;

		var attributes = geometry.attributes;
		var positions = attributes.position.array;
		var normals = attributes.normal.array;

		if ( attributes.color === undefined ) {

			var colors = new Float32Array( positions.length );
			geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).setDynamic( true ) );

		}

		var colors = attributes.color.array;

		var startVertex = currentVertex;
		var totalVertex = positions.length / 3;

		for ( var i = 0; i < 32; i ++ ) {

			if ( currentVertex >= totalVertex ) break;

			position.fromArray( positions, currentVertex * 3 );
			position.applyMatrix4( object.matrixWorld );

			normal.fromArray( normals, currentVertex * 3 );
			normal.applyMatrix3( normalMatrix.getNormalMatrix( object.matrixWorld ) ).normalize();

			camera.position.copy( position );
			camera.lookAt( position.add( normal ) );

			renderer.render( clone, camera, rt);
			// renderer.render( clone, camera);
			// return;
			renderer.readRenderTargetPixels( rt, 0, 0, SIZE, SIZE, buffer );

			color[ 0 ] = 0;
			color[ 1 ] = 0;
			color[ 2 ] = 0;

			for ( var k = 0, kl = buffer.length; k < kl; k += 4 ) {

				color[ 0 ] += buffer[ k + 0 ];
				color[ 1 ] += buffer[ k + 1 ];
				color[ 2 ] += buffer[ k + 2 ];

			}

			colors[ currentVertex * 3 + 0 ] = color[ 0 ] / ( SIZE2 * 255 );
			colors[ currentVertex * 3 + 1 ] = color[ 1 ] / ( SIZE2 * 255 );
			colors[ currentVertex * 3 + 2 ] = color[ 2 ] / ( SIZE2 * 255 );

			currentVertex ++;

		}

		attributes.color.updateRange.offset = startVertex * 3;
		attributes.color.updateRange.count = ( currentVertex - startVertex ) * 3;
		attributes.color.needsUpdate = true;

		if ( currentVertex >= totalVertex ) {
			if(meshIndex === meshs.length - 1){

				// clone = scene.clone();
				// clone.autoUpdate = false;

				bounces ++;
				meshIndex = 0;
			}else{
				meshIndex++;
			}

			currentVertex = 0;

		}

		requestAnimationFrame( compute );

	}

	requestAnimationFrame( compute );
	// compute();
}

