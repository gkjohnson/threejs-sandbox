#include "pch.h"
#include <fstream>
#include <iostream>
#include "studio.h"
#include "optimize.h"

using namespace std;
using namespace OptimizedModel;
int main()
{
	// Log the struct sizes
	cout << "studiohdr_t " << sizeof(struct studiohdr_t) << endl;
	cout << "mstudiobone_t " << sizeof(struct mstudiobone_t) << endl;
	cout << "BodyPartHeader_t " << sizeof(struct BodyPartHeader_t) << endl;
	cout << "ModelHeader_t " << sizeof(struct ModelHeader_t) << endl;
	cout << "ModelLODHeader_t " << sizeof(struct ModelLODHeader_t) << endl;
	cout << "MeshHeader_t " << sizeof(struct MeshHeader_t) << endl;
	cout << "StripGroupHeader_t " << sizeof(struct StripGroupHeader_t) << endl;
	cout << "StripHeader_t " << sizeof(struct StripHeader_t) << endl;

	ifstream file("../../models/Link_-_Hyrule_Warriors_IpV1rRa/models/hyrulewarriors/link_ball_and_chain_lvl3.dx90.vtx");

	//get length of file
	file.seekg(0, file.end);
	unsigned int length = file.tellg();
	file.seekg(0, file.beg);

	// read in the buffer
	char* buffer = new char[length];
	file.read(buffer, length);

	FileHeader_t* ptr = (FileHeader_t*)buffer;

	for (int i = 0; i < ptr->numBodyParts; i++) {

		BodyPartHeader_t* bh = ptr->pBodyPart(i);
		for (int i2 = 0; i2 < bh->numModels; i2++) {

			ModelHeader_t* mh = bh->pModel(i2);
			for (int i3 = 0; i3 < mh->numLODs; i3++) {

				ModelLODHeader_t* lod = mh->pLOD(i3);
				for (int i4 = 0; i4 < lod->numMeshes; i4++) {

					MeshHeader_t* mesh = lod->pMesh(i4);
					for (int i5 = 0; i5 < mesh->numStripGroups; i5++) {

						StripGroupHeader_t* sg = mesh->pStripGroup(i5);
						cout << endl << "STRIP GROUPS -- " << endl;
						cout << "numStrips: " << sg->numStrips << endl;

						cout << "numVerts: " << sg->numVerts << endl;
						cout << "vertOffset: " << sg->vertOffset << endl;

						cout << "numIndices: " << sg->numIndices << endl;
						cout << "indexOffset: " << sg->indexOffset << endl;


						for (int i6 = 0; i6 < sg->numStrips; i6++) {

							StripHeader_t* sh = sg->pStrip(i6);
							//cout << "num verts: " << sg->numVerts << endl;
							cout << endl << "STRIPS -- " << endl;
							cout << "numIndices: " << sh->numIndices << endl;
							cout << "indexOffset: " << sh->indexOffset << endl;

							cout << "numVerts: " << sh->numVerts << endl;
							cout << "vertOffset: " << sh->vertOffset << endl;

							cout << "numBones: " << sh->numBones << endl;
							cout << "numBoneStateChanges: " << sh->numBoneStateChanges << endl;
							cout << "boneStateChangeOffset: " << sh->boneStateChangeOffset << endl;
							cout << "flags: " << (unsigned int) sh->flags << endl;

						}
					}
				}
			}
		}
	}

	delete[] buffer;
}
