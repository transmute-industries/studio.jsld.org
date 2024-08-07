
import jsonld from 'jsonld'


const allowedUri = (uri: string)=>{
  return uri.startsWith('https://www.w3.org/') || uri.startsWith('https://ref.gs1.org/') || uri.startsWith('https://jsld.org/')
}

const documentLoader = async (uri: string) => {

  if (allowedUri(uri)){
    const res = await fetch(uri)
    const json = await res.json();
    return { document: json }
  }

  console.error(uri)
  throw new Error("Unsupported URI: " + uri)
}

export async function POST(request: Request) {
  const { document, context } = await request.json()
  let doc, ctx = undefined;
  try{
    doc = JSON.parse(document)
  } catch(e){
    return Response.json({
      "type": "https://studio.jsld.org/problems/json-parse-error",
      "title": 'document is not valid JSON',
      "detail": 'Invalid application/json.',
    }, {
      status: 403
    })
  }
  try{
    ctx = JSON.parse(context)
    doc['@context'] = ctx
  } catch(e){
    return Response.json({
      "type": "https://studio.jsld.org/problems/json-parse-error",
      "title": 'context is not valid JSON',
      "detail": 'Invalid application/json.',
    }, {
      status: 403
    })
  }
  try {
    const canonized = await jsonld.canonize(doc, {
      algorithm: 'URDNA2015',
      format: 'application/n-quads',
      documentLoader
    });
    return Response.json({ 'application/n-quads': canonized })
  } catch (e) {
    const error = e as unknown as any;
    console.error(e)
    if (error.details && error.details.event) {
      const { event } = error.details;
      return Response.json({
        "type": "https://studio.jsld.org/problems/canonize-error",
        "title": event.code,
        "detail": event.message,
      }, {
        status: 403
      })
    }
    return Response.json({
      "type": "https://studio.jsld.org/problems/unknown-canonize-error",
      "title": "Invalid application/n-quads.",
    },
    {
      status: 500
    })
  }
}