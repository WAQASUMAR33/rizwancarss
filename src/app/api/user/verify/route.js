import prisma from "@/utils/prisma";
export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  console.log("Token is ",token);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400 });
  }

  try {
    const user = await prisma.users.findFirst({
      where: { token },
    });

    console.log("user is found",user)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400 });
    }

    // Invalidate the token before doing anything else
    const response = await prisma.users.update({
      where: { id: user.id },
      data: {
        emailverification: 'True',
        token: 'null', 
      },
    });
    console.log("response is ",response);
    return new Response(JSON.stringify({ message: 'Email verified successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
