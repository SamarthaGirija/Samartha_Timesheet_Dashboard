package com.samartha;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;


@WebServlet("/CallingServlet1")
public class DatabaseConnection extends HttpServlet {
    
    @Override
    public void service(ServletRequest req, ServletResponse res) throws ServletException, IOException {
        String url = "jdbc:mysql://localhost:3307/yd";
        String uname = "root";
        String passwd = "root";
        Connection con = null;
        PreparedStatement pstmt = null;
        PrintWriter out = res.getWriter();
        res.setContentType("text/html");

        String sql = "INSERT INTO `employee` (`eid`, `ename`, `client`, `wh`, `loc`) VALUES (?, ?, ?, ?, ?)";
        
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("Driver loaded");
            con = DriverManager.getConnection(url, uname, passwd);
            System.out.println("Connection success");
            
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, req.getParameter("eid"));
            pstmt.setString(2, req.getParameter("ename"));
            pstmt.setString(3, req.getParameter("client"));
            pstmt.setString(4, req.getParameter("wh"));
            pstmt.setString(5, req.getParameter("loc"));
            
            int n = pstmt.executeUpdate();
            if (n > 0) {
                out.print("REGISTRATION SUCCESSFUL");
            } else {
                out.print("REGISTRATION FAILURE");
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            out.print("Driver not found: " + e.getMessage());
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("SQL Exception: " + e.getMessage());
        } finally {
            try {
                if (pstmt != null) pstmt.close();
                if (con != null) con.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
