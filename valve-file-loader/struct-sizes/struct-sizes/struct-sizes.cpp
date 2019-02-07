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
	cout << ptr->version<< endl;

	delete[] buffer;
}
