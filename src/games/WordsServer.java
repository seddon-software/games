package games;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


@SuppressWarnings("serial")
@WebServlet("/WordsServer")
public class WordsServer extends HttpServlet {
	private static final String INPUT_FILE = "/words.txt";		// served relative to WebContent
	private String wordsFromFile = "";
	private String words = "";
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		PrintWriter out = response.getWriter();
		try {
			if (wordsFromFile.equals("")) wordsFromFile = readInputFile();
			String word = getNextWord();
			out.write(word);
	    } finally {
	        
	    }		
	}

	private String getNextWord() {
		if (words.equals("")) words = wordsFromFile;
		String word = "";
		do {
			try {
				String[] theSplit = words.split("[ ,.:;'?!-]+", 2);
				words = theSplit[1];
				word = theSplit[0];
			} catch(ArrayIndexOutOfBoundsException e) {
				// run out of words, so start again
				words = wordsFromFile;
			}
		} while(word.length() < 4);
		return word;
	}

	private String readInputFile() throws IOException {
		ServletContext context = getServletContext();
		InputStream inputStream = context.getResourceAsStream(INPUT_FILE); 
		byte[] data = convertToByteArray(inputStream);
		inputStream.read(data);
		inputStream.close();
		String text = new String(data);
		text = text.replace("\n", " ");  // convert newlines to spaces
		return text;
	}

	private byte[] convertToByteArray(InputStream inputStream) throws IOException {
		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
		int nRead;
		byte[] data = new byte[16384];

		while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
  		    buffer.write(data, 0, nRead);
		}

		buffer.flush();
		byte[] allData = buffer.toByteArray();
		return allData;
	}
	
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
}
