#pragma once

#include <cstddef>

#define DECLARE_BYTESWAP_DATADESC();
#define PackNormal_UBYTE4(a,b,c,d);
#define UnpackNormal_UBYTE4(a,b);
#define NULL 0

#undef Assert
void Assert(int) {}
void Assert(void*) {}
void AssertMsg(bool, const char*) {}
typedef unsigned char byte;
typedef unsigned short float16;


//void memcpy(void*, void*, int) {}
//void memset(void*, int, int) {}

struct Vector2D {
	float x, y;
};

struct Vector {
	float x, y, z;
};

struct Vector32 {
	unsigned short x:10, y:10, z:10;
	unsigned short exp:2;
};

struct Vector48 {
	short x:16, y:16, z:16;
};

struct Vector4D {
	float x, y, z, w;
};

struct Vector4DAligned : Vector4D { };

struct Quaternion {
	float x, y, z, w;
};

struct Quaternion48 {
	unsigned short x : 16;
	unsigned short y : 16;
	unsigned short z : 15;
	unsigned short wneg : 1;
};

struct Quaternion64 {
	unsigned int x : 21;
	unsigned int y : 21;
	unsigned int z : 21;
	unsigned int wneg : 1;
};

struct RadianEuler {
	float x, y, z;
};

struct matrix3x4_t {
	float elements[12];
};

int max(int, int) { return 0; }
int Clamp(int, int, int) { return 0; }
template< class T >
class CUtlVector {
public:
	int Count() { return 0; }
};

enum LocalFlexController_t
{
	// this isn't really an enum - its just a typed int. gcc will not accept it as a fwd decl, so we'll define one value
	DUMMY_FLEX_CONTROLLER = 0x7fffffff						// make take 32 bits
};
