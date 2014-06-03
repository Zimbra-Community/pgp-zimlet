<%@ page import="java.util.*" %>
<%@ page import="java.net.*" %>
<%@ page import="java.io.*" %>
<%
String q = request.getParameter("q");
String html ="";

if (q != null) {
       StringBuffer sbf = new StringBuffer();
        try {
                URL url = new URL("http://hkps.pool.sks-keyservers.net/pks/lookup?op=get&options=mr&search=" + q);
                BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream()));
                String inputLine;
                while ( (inputLine = in.readLine()) != null) sbf.append(inputLine +"\n");
                in.close();
        } catch (MalformedURLException e) {
        } catch (IOException e) {
        }
        html = sbf.toString();

} else {
    html = "parameter q not specified";
}
%>
<textarea rows="30" cols="100">
<%= html%>
</textarea>
