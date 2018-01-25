package games;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;



class MyComparator implements Comparator<String> {
    public int compare(String o1, String o2){
    	String[] s1 = o1.split("[ ]");
    	String[] s2 = o2.split("[ ]");
    	int x1 = Integer.parseInt(s1[0]);
    	int x2 = Integer.parseInt(s2[0]);
        return x1 - x2;
    }
}

@SuppressWarnings("serial")
@WebServlet("/MemoryServer")
public class MemoryServer extends HttpServlet {
    private static final String jdbcDriver = "com.mysql.jdbc.Driver";
    private static final String url = "jdbc:mysql://localhost:3306/games?autoReconnect=true&useSSL=false";
    private static final String user = "seddon";
    private static final String password = "xhlesley1A";

    private static Statement statement;
    private static Connection connection;
    private String time;
    private String date;
    private String name;
    
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        try {
        		PrintWriter out = response.getWriter();
        		setInputVariables(request);
            ConnectToDatabase();
            updateDatabaseWithLatestResult();
        		ArrayList<String> results = getTopFiveResultsFromDatabase();
        		returnTopFiveResultsToClient(out, results);
        } catch (Exception e) {
            System.out.println(e);
        }
	}

    private void updateDatabaseWithLatestResult() throws SQLException {
        clearLatestResultFlag();
        statement = connection.createStatement();
        String sql = String.format("INSERT INTO results (time, date, name, latest) VALUES ('%s', '%s', '%s', '*')", time, date, name); 
        statement.executeUpdate(sql);
        statement.close();
    }

    private void clearLatestResultFlag() throws SQLException {
        statement = connection.createStatement();
        String sql = String.format("UPDATE results SET latest = ' ' WHERE name = '%s'", name); 
        statement.executeUpdate(sql);
        statement.close();
    }

    private void setInputVariables(HttpServletRequest request) throws ServletException {
        time = request.getParameter("time");
        name = request.getParameter("name");
        
        java.util.Date dt = new java.util.Date();
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        date = sdf.format(dt);
        
        if(time == null) throw new ServletException("Illegal parameter: time");
        if(name == null) throw new ServletException("Illegal parameter: name");        
    }

	private void ConnectToDatabase() throws Exception {
	    Class.forName(jdbcDriver).newInstance();
        connection = DriverManager.getConnection(url, user, password);
    }

    private ArrayList<String> getTopFiveResultsFromDatabase() throws SQLException {
        Statement statement = connection.createStatement();
        String sql = String.format("SELECT time, date, latest FROM results WHERE name = '%s' ORDER BY time ASC LIMIT 10", name);
        ResultSet resultSet = statement.executeQuery(sql);
        ArrayList<String> topFive = new ArrayList<String>();
        
        while (resultSet.next()) {
            time = resultSet.getString("time");
            date = resultSet.getString("date");
            String[] dateParts = date.split(" ");
            String date = dateParts[0];
            
            String latest = resultSet.getString("latest");
            if(latest.equals("*")) date = date + "*" ;
            topFive.add(String.format("%s %s", time, date));            
        }
        statement.close();
        return topFive;
    }

    private void returnTopFiveResultsToClient(PrintWriter out, ArrayList<String> results) {
        // return an array of top results
        StringBuffer response = new StringBuffer("");
        String quote = "\"";
        response.append("[");            
        for(int i = 0; i < results.size(); i++) {
            response.append(quote + results.get(i) + quote);            
            if(i != results.size() -1) response.append(",");            
        }
        response.append("]");            
        String json = response.toString();
        out.print(json);
        out.flush();
    }

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
}
