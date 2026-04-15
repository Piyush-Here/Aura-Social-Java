package com.aura.repository;

import com.aura.domain.Message;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        select m from Message m
        where (m.sender.username = :first and m.recipient.username = :second)
           or (m.sender.username = :second and m.recipient.username = :first)
        order by m.createdAt asc
        """)
    List<Message> findConversation(@Param("first") String first, @Param("second") String second);

    @Query("""
        select m from Message m
        where m.sender.username = :username or m.recipient.username = :username
        order by m.createdAt desc
        """)
    List<Message> findAllForUser(@Param("username") String username);
}
