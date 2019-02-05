#include "pch.h"
#include <iostream>
#include "studio.h"
#include "optimize.h"

using namespace OptimizedModel;
int main()
{
	std::cout << "studiohdr_t " << sizeof(struct studiohdr_t) << std::endl;
	std::cout << "mstudiobone_t " << sizeof(struct mstudiobone_t) << std::endl;
	std::cout << "BodyPartHeader_t " << sizeof(struct BodyPartHeader_t) << std::endl;
	std::cout << "ModelHeader_t " << sizeof(struct ModelHeader_t) << std::endl;
	std::cout << "ModelLODHeader_t " << sizeof(struct ModelLODHeader_t) << std::endl;
	std::cout << "MeshHeader_t " << sizeof(struct MeshHeader_t) << std::endl;
	std::cout << "StripGroupHeader_t " << sizeof(struct StripGroupHeader_t) << std::endl;
	std::cout << "StripHeader_t " << sizeof(struct StripHeader_t) << std::endl;
}
