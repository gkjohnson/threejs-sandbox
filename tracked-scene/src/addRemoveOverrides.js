import { Object3D } from 'three';

const _ogAdd = Object3D.prototype.add;
const _ogRemove = Object3D.prototype.remove;
function add( ...args ) {

    _ogAdd.apply( this, args );

    if (args.length === 1) {

        this.dispatchEvent( { type: 'childadded', child: args[ 0 ] } );

    }
};

function remove( ...args ) {

    _ogRemove.apply( this, args );

    if ( args.length === 1 ) {

        this.dispatchEvent( { type: 'childremoved', child: args[ 0 ] } );

    }

};

export { add, remove };
